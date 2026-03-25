"""
Embedding Pipeline — PSG Advantage Platform v2

Given a repair order record, generates a semantic embedding and upserts it
into the Qdrant `shop_content` collection. Designed to be called:
  - From the bq-daily-sync pipeline (batch mode)
  - From the API layer on-demand (single-record mode)

Model selection rationale (see docs/model-selection.md):
  text-embedding-3-small (OpenAI)
    - 1536 dimensions: compact yet high-recall for retrieval tasks
    - Cost: ~$0.02 / 1M tokens — suitable for per-RO embedding at scale
    - Outperforms ada-002 on MTEB benchmarks while costing the same
    - Switching cost to text-embedding-3-large is minimal (same API shape)
  If embedding quality degrades at scale, evaluate text-embedding-3-large
  (3072-dim) or a fine-tuned open-source model (e.g., BGE-M3 via Qdrant Fastembed).

Usage (single record):
    python ai-infra/embedding_pipeline.py --ro-id <uuid>

Batch mode (pipe JSON array from stdin):
    cat repair_orders.json | python ai-infra/embedding_pipeline.py --batch

Environment variables:
    OPENAI_API_KEY  — OpenAI key for embeddings
    QDRANT_URL      — Qdrant server URL (default: http://localhost:6333)
    QDRANT_API_KEY  — Qdrant API key (optional)
    SUPABASE_URL    — Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import uuid
from dataclasses import dataclass
from typing import Any

import openai
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from supabase import create_client, Client as SupabaseClient

# ─── Config ───────────────────────────────────────────────────────────────────

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY")
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

EMBEDDING_MODEL = "text-embedding-3-small"
COLLECTION_NAME = "shop_content"
BATCH_SIZE = 100  # OpenAI embedding API accepts up to 2048 inputs per request

# ─── Data model ───────────────────────────────────────────────────────────────

@dataclass
class RepairOrderPayload:
    ro_id: str
    company_id: str          # raw UUID — will be hashed for storage
    completed_at: str        # ISO timestamp
    period: str              # YYYY-MM
    csi_score: float | None
    customer_notes: str | None
    tech_notes: str | None
    pay_type: str
    revenue: float

    def to_text(self) -> str:
        """
        Builds the text blob that gets embedded.
        Concatenating structured fields + free-text notes gives the model
        enough signal to retrieve similar ROs for RAG prompts.
        """
        parts = [
            f"Repair order: {self.ro_id}",
            f"Period: {self.period}",
            f"Pay type: {self.pay_type}",
            f"Revenue: ${self.revenue:.2f}",
        ]
        if self.csi_score is not None:
            parts.append(f"CSI score: {self.csi_score:.1f}")
        if self.customer_notes:
            parts.append(f"Customer notes: {self.customer_notes}")
        if self.tech_notes:
            parts.append(f"Technician notes: {self.tech_notes}")
        return "\n".join(parts)

    def to_qdrant_payload(self) -> dict[str, Any]:
        return {
            "ro_id": self.ro_id,
            "company_id": hashlib.sha256(self.company_id.encode()).hexdigest(),
            "period": self.period,
            "content_type": "repair_order",
            "pay_type": self.pay_type,
            "csi_score": self.csi_score,
            "completed_at": self.completed_at,
        }

# ─── Embedding ────────────────────────────────────────────────────────────────

def embed_texts(texts: list[str]) -> list[list[float]]:
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def upsert_to_qdrant(
    qdrant: QdrantClient,
    records: list[RepairOrderPayload],
    embeddings: list[list[float]],
) -> None:
    points = [
        PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, r.ro_id)),
            vector=embedding,
            payload=r.to_qdrant_payload(),
        )
        for r, embedding in zip(records, embeddings)
    ]
    qdrant.upsert(collection_name=COLLECTION_NAME, points=points)

# ─── Supabase fetch ───────────────────────────────────────────────────────────

def fetch_repair_order(supabase: SupabaseClient, ro_id: str) -> RepairOrderPayload | None:
    resp = (
        supabase.table("repair_orders")
        .select(
            "id, company_id, completed_at, csi_score, customer_notes, "
            "tech_notes, pay_type, revenue"
        )
        .eq("id", ro_id)
        .single()
        .execute()
    )
    if not resp.data:
        return None
    row = resp.data
    period = row["completed_at"][:7]  # YYYY-MM
    return RepairOrderPayload(
        ro_id=row["id"],
        company_id=row["company_id"],
        completed_at=row["completed_at"],
        period=period,
        csi_score=row.get("csi_score"),
        customer_notes=row.get("customer_notes"),
        tech_notes=row.get("tech_notes"),
        pay_type=row.get("pay_type", "unknown"),
        revenue=float(row.get("revenue", 0)),
    )

# ─── Pipeline ─────────────────────────────────────────────────────────────────

def run_single(ro_id: str) -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    record = fetch_repair_order(supabase, ro_id)
    if not record:
        print(f"[embedding_pipeline] Repair order {ro_id} not found.")
        sys.exit(1)

    [embedding] = embed_texts([record.to_text()])
    upsert_to_qdrant(qdrant, [record], [embedding])
    print(f"[embedding_pipeline] Embedded RO {ro_id}.")


def run_batch(records_json: list[dict]) -> None:
    qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    records = [
        RepairOrderPayload(
            ro_id=r["id"],
            company_id=r["company_id"],
            completed_at=r["completed_at"],
            period=r["completed_at"][:7],
            csi_score=r.get("csi_score"),
            customer_notes=r.get("customer_notes"),
            tech_notes=r.get("tech_notes"),
            pay_type=r.get("pay_type", "unknown"),
            revenue=float(r.get("revenue", 0)),
        )
        for r in records_json
    ]

    total = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        texts = [r.to_text() for r in batch]
        embeddings = embed_texts(texts)
        upsert_to_qdrant(qdrant, batch, embeddings)
        total += len(batch)
        print(f"[embedding_pipeline] Upserted {total}/{len(records)} records.")

    print(f"[embedding_pipeline] Batch complete. {total} records embedded.")


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PSG embedding pipeline")
    parser.add_argument("--ro-id", help="Embed a single repair order by UUID")
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Read JSON array of repair orders from stdin and embed in batch",
    )
    args = parser.parse_args()

    if args.ro_id:
        run_single(args.ro_id)
    elif args.batch:
        data = json.load(sys.stdin)
        run_batch(data)
    else:
        parser.print_help()
        sys.exit(1)

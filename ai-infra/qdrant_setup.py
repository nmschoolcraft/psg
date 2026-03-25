"""
Qdrant Collection Setup — PSG Advantage Platform v2

Creates the `shop_content` collection used for embedding-based RAG retrieval.
Run once during infra provisioning, or re-run safely (idempotent).

Usage:
    pip install qdrant-client
    QDRANT_URL=http://localhost:6333 python ai-infra/qdrant_setup.py

Environment variables:
    QDRANT_URL      — Qdrant server URL (default: http://localhost:6333)
    QDRANT_API_KEY  — API key (optional; required for Qdrant Cloud)
"""

import os
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PayloadSchemaType,
    OptimizersConfigDiff,
    HnswConfigDiff,
)

QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY")

# text-embedding-3-small output dimension
VECTOR_SIZE = 1536

# Collection: shop_content
# Each point represents a chunk of content associated with a repair order or shop,
# ready for RAG retrieval (CSI follow-up emails, repair summaries, marketing copy).
COLLECTION_NAME = "shop_content"


def setup_qdrant() -> None:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    existing = {c.name for c in client.get_collections().collections}

    if COLLECTION_NAME in existing:
        print(f"[qdrant_setup] Collection '{COLLECTION_NAME}' already exists — skipping create.")
    else:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
            # HNSW tuning: m=16, ef_construct=100 balances recall vs. index size.
            hnsw_config=HnswConfigDiff(
                m=16,
                ef_construct=100,
                full_scan_threshold=10_000,
            ),
            # Moderate indexing threshold to keep write throughput high during bulk loads.
            optimizers_config=OptimizersConfigDiff(
                indexing_threshold=20_000,
            ),
        )
        print(f"[qdrant_setup] Created collection '{COLLECTION_NAME}'.")

    # Create payload indexes for common filter fields
    payload_indexes = [
        ("company_id", PayloadSchemaType.KEYWORD),
        ("content_type", PayloadSchemaType.KEYWORD),   # "repair_order" | "csi_response" | "marketing"
        ("period", PayloadSchemaType.KEYWORD),          # YYYY-MM
    ]

    for field_name, schema_type in payload_indexes:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field_name,
            field_schema=schema_type,
        )
        print(f"[qdrant_setup] Ensured payload index: {field_name} ({schema_type})")

    print(f"[qdrant_setup] Setup complete. Collection '{COLLECTION_NAME}' is ready.")


if __name__ == "__main__":
    setup_qdrant()

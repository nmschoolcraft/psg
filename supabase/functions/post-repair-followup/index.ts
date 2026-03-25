/**
 * Edge Function: post-repair-followup
 *
 * PHASE 2 — skeleton only. Full implementation deferred.
 *
 * Purpose:
 *   Triggered N days after a repair_order transitions to 'completed'.
 *   Sends a CSI survey link to the customer (via SMS or email).
 *   Optionally re-sends if no survey response received within 3 days.
 *
 * Trigger:
 *   pg_cron or Supabase Scheduled functions (Phase 2)
 *   Query: repair_orders WHERE status = 'completed'
 *           AND completed_at < now() - interval '3 days'
 *           AND NOT EXISTS (SELECT 1 FROM surveys WHERE ro_id = ro.id)
 *
 * Invocation example (for testing):
 *   curl -X POST https://<project>.supabase.co/functions/v1/post-repair-followup \
 *     -H "Authorization: Bearer <service-role-key>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"ro_id": "<uuid>"}'
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface FollowupPayload {
  ro_id: string;
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload: FollowupPayload = await req.json();
    const { ro_id } = payload;

    if (!ro_id) {
      return new Response(
        JSON.stringify({ error: 'ro_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch RO + customer details
    const { data: ro, error: roError } = await supabase
      .from('repair_orders')
      .select(`
        id, ro_number, company_id, completed_at,
        repair_customers ( id, name, phone, email ),
        vehicles ( year, make, model )
      `)
      .eq('id', ro_id)
      .single();

    if (roError || !ro) {
      return new Response(
        JSON.stringify({ error: 'Repair order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Check survey doesn't already exist
    const { data: existingSurvey } = await supabase
      .from('surveys')
      .select('id')
      .eq('ro_id', ro_id)
      .limit(1)
      .single();

    if (existingSurvey?.id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Survey already exists for this RO' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // TODO (Phase 2): Send follow-up SMS/email with survey link
    // For now, log and return success skeleton
    console.log(`[post-repair-followup] Would send follow-up for RO ${ro.ro_number} to customer`, ro.repair_customers);

    return new Response(
      JSON.stringify({
        queued:    true,
        ro_id,
        ro_number: ro.ro_number,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[post-repair-followup] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

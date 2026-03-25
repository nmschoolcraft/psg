/**
 * Edge Function: onboarding-recovery
 *
 * PHASE 2 — skeleton only. Full implementation deferred.
 *
 * Purpose:
 *   Triggered when a user's session exists but the company profile
 *   is incomplete (is_onboarding_complete() = false). Sends a
 *   follow-up email with a direct link back to the onboarding flow.
 *
 * Trigger (to be configured in Supabase dashboard):
 *   Database webhook on companies table (INSERT or UPDATE)
 *   when address IS NULL OR phone IS NULL OR name IS NULL
 *
 * Invocation example (for testing):
 *   curl -X POST https://<project>.supabase.co/functions/v1/onboarding-recovery \
 *     -H "Authorization: Bearer <service-role-key>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"company_id": "<uuid>", "user_email": "owner@shop.com"}'
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RecoveryPayload {
  company_id: string;
  user_email: string;
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload: RecoveryPayload = await req.json();
    const { company_id, user_email } = payload;

    if (!company_id || !user_email) {
      return new Response(
        JSON.stringify({ error: 'company_id and user_email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify company profile is actually incomplete
    const { data: isComplete } = await supabase
      .rpc('is_onboarding_complete', { p_company_id: company_id });

    if (isComplete) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Onboarding already complete' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // TODO (Phase 2): Send recovery email via Resend/SendGrid
    // For now, log and return success skeleton
    console.log(`[onboarding-recovery] Would send recovery email to ${user_email} for company ${company_id}`);

    return new Response(
      JSON.stringify({ queued: true, company_id, recipient: user_email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[onboarding-recovery] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

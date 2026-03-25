import * as Sentry from '@sentry/node';
import { parse } from 'csv-parse/sync';
import { supabase } from '../supabase';
import { applyMapping, validateRow } from './validate';
import type {
  FieldMappingTemplate,
  ImportResult,
  NormalizedRepairOrder,
  RowError,
} from './types';

/**
 * Default field mapping: covers common v1 export column names.
 * Companies can override this via their saved field_mappings template.
 */
const DEFAULT_MAPPING: FieldMappingTemplate = {
  'RO #':           'ro_number',
  'RO Number':      'ro_number',
  'Customer':       'customer_name',
  'Customer Name':  'customer_name',
  'Phone':          'customer_phone',
  'Email':          'customer_email',
  'Year':           'vehicle_year',
  'Make':           'vehicle_make',
  'Model':          'vehicle_model',
  'VIN':            'vehicle_vin',
  'Status':         'status',
  'Completed':      'completed_at',
  'Completed Date': 'completed_at',
  'Revenue':        'revenue',
  'Pay Type':       'pay_type',
  'Carrier':        'carrier_name',
  'Agent':          'agent_name',
};

export async function processRepairOrdersCsv(
  companyId: string,
  csvBuffer: Buffer,
  templateName?: string,
): Promise<ImportResult> {
  // Load company's saved field mapping (falls back to default)
  const mapping = await resolveMapping(companyId, templateName);

  // Parse CSV
  const rawRows: Record<string, string>[] = parse(csvBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // 1-indexed + header row
    const normalized = applyMapping(rawRows[i], mapping);
    const rowErrors  = validateRow(normalized, rowNum);

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      skipped++;
      continue;
    }

    try {
      await upsertRepairOrder(companyId, normalized as NormalizedRepairOrder);
      inserted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ row: rowNum, field: 'db', message });
      skipped++;

      Sentry.captureException(err, {
        extra: { companyId, rowNum, ro_number: normalized.ro_number },
      });
    }
  }

  return { total: rawRows.length, inserted, skipped, errors };
}

async function resolveMapping(
  companyId: string,
  templateName?: string,
): Promise<FieldMappingTemplate> {
  if (!templateName) return DEFAULT_MAPPING;

  const { data } = await supabase
    .from('companies')
    .select('field_mappings')
    .eq('id', companyId)
    .single();

  const saved = data?.field_mappings?.[templateName] as FieldMappingTemplate | undefined;
  return saved ?? DEFAULT_MAPPING;
}

async function upsertRepairOrder(
  companyId: string,
  row: NormalizedRepairOrder,
): Promise<void> {
  // Upsert customer (match by phone or email within company)
  const customerId = await upsertCustomer(companyId, row);

  // Upsert vehicle if we have enough info
  const vehicleId = await upsertVehicle(companyId, customerId, row);

  // Upsert insurance entity
  const insuranceId = row.carrier_name
    ? await upsertInsurance(companyId, row)
    : null;

  // Upsert repair order (idempotent on company_id + ro_number)
  const { error } = await supabase.from('repair_orders').upsert(
    {
      company_id:   companyId,
      customer_id:  customerId,
      ro_number:    row.ro_number,
      vehicle_id:   vehicleId,
      status:       normalizeStatus(row.status),
      completed_at: row.completed_at ?? null,
      revenue:      row.revenue ?? null,
      pay_type:     row.pay_type ?? null,
    },
    { onConflict: 'company_id,ro_number', ignoreDuplicates: false },
  );

  if (error) throw new Error(`RO upsert failed: ${error.message}`);

  // Suppress unused var — will be used when referral tracking is added
  void insuranceId;
}

async function upsertCustomer(
  companyId: string,
  row: NormalizedRepairOrder,
): Promise<string> {
  // Try to find existing customer by phone or email
  if (row.customer_phone || row.customer_email) {
    const query = supabase
      .from('repair_customers')
      .select('id')
      .eq('company_id', companyId);

    if (row.customer_phone) {
      query.ilike('phone', row.customer_phone.replace(/\D/g, '') + '%');
    } else if (row.customer_email) {
      query.ilike('email', row.customer_email);
    }

    const { data } = await query.limit(1).single();
    if (data?.id) return data.id;
  }

  // Create new customer
  const { data, error } = await supabase
    .from('repair_customers')
    .insert({
      company_id: companyId,
      name:       row.customer_name,
      phone:      row.customer_phone ?? null,
      email:      row.customer_email ?? null,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Customer insert failed: ${error?.message}`);
  return data.id;
}

async function upsertVehicle(
  companyId: string,
  customerId: string,
  row: NormalizedRepairOrder,
): Promise<string | null> {
  if (!row.vehicle_make && !row.vehicle_vin) return null;

  // Match by VIN if available
  if (row.vehicle_vin) {
    const { data } = await supabase
      .from('vehicles')
      .select('id')
      .eq('company_id', companyId)
      .eq('vin', row.vehicle_vin)
      .limit(1)
      .single();
    if (data?.id) return data.id;
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      company_id:  companyId,
      customer_id: customerId,
      year:        row.vehicle_year ?? null,
      make:        row.vehicle_make ?? null,
      model:       row.vehicle_model ?? null,
      vin:         row.vehicle_vin ?? null,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Vehicle insert failed: ${error?.message}`);
  return data.id;
}

async function upsertInsurance(
  companyId: string,
  row: NormalizedRepairOrder,
): Promise<string | null> {
  if (!row.carrier_name) return null;

  const { data } = await supabase
    .from('insurance_entities')
    .select('id')
    .eq('company_id', companyId)
    .ilike('carrier_name', row.carrier_name)
    .limit(1)
    .single();

  if (data?.id) {
    await supabase.rpc('increment_claim_count', { p_insurance_id: data.id });
    return data.id;
  }

  const { data: created, error } = await supabase
    .from('insurance_entities')
    .insert({
      company_id:   companyId,
      carrier_name: row.carrier_name,
      agent_name:   row.agent_name ?? null,
      claim_count:  1,
    })
    .select('id')
    .single();

  if (error || !created) return null;
  return created.id;
}

function normalizeStatus(raw?: string): string {
  if (!raw) return 'open';
  const map: Record<string, string> = {
    'open':          'open',
    'in progress':   'in_progress',
    'in-progress':   'in_progress',
    'waiting parts': 'waiting_parts',
    'supplement':    'waiting_supplements',
    'ready':         'ready',
    'delivered':     'delivered',
    'completed':     'completed',
    'complete':      'completed',
    'cancelled':     'cancelled',
    'canceled':      'cancelled',
  };
  return map[raw.toLowerCase()] ?? 'open';
}

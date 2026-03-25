import { z } from 'zod';
import type { NormalizedRepairOrder, RowError } from './types';

// Known pay_type values (mirrors the DB enum)
const PAY_TYPES = ['insurance', 'customer_pay', 'warranty', 'fleet', 'other'] as const;

// Zod schema for a single normalized row
const roSchema = z.object({
  ro_number:     z.string().min(1, 'RO number is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  vehicle_year:  z.number().int().min(1900).max(2100).optional(),
  vehicle_make:  z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_vin:   z.string().max(17).optional(),
  status:        z.string().optional(),
  completed_at:  z.string().optional(),
  revenue:       z.number().min(0).optional(),
  pay_type:      z.enum(PAY_TYPES).optional(),
  carrier_name:  z.string().optional(),
  agent_name:    z.string().optional(),
});

export function validateRow(
  row: Partial<NormalizedRepairOrder>,
  rowIndex: number,
): RowError[] {
  const result = roSchema.safeParse(row);
  if (result.success) return [];

  return result.error.issues.map((issue) => ({
    row:     rowIndex,
    field:   issue.path.join('.') || 'unknown',
    message: issue.message,
    value:   String((row as Record<string, unknown>)[issue.path[0]] ?? ''),
  }));
}

/** Apply a field mapping template to a raw CSV row */
export function applyMapping(
  rawRow: Record<string, string>,
  mapping: Record<string, string>,
): Partial<NormalizedRepairOrder> {
  const result: Record<string, unknown> = {};
  for (const [csvHeader, internalField] of Object.entries(mapping)) {
    const value = rawRow[csvHeader];
    if (value === undefined || value === '') continue;

    switch (internalField) {
      case 'vehicle_year':
        result[internalField] = parseInt(value, 10) || undefined;
        break;
      case 'revenue':
        result[internalField] = parseFloat(value.replace(/[$,]/g, '')) || undefined;
        break;
      default:
        result[internalField] = value.trim();
    }
  }
  return result as Partial<NormalizedRepairOrder>;
}

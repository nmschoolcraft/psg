// Types for the CSV import pipeline

/** Canonical field names used internally after mapping */
export interface NormalizedRepairOrder {
  ro_number:    string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_year?:  number;
  vehicle_make?:  string;
  vehicle_model?: string;
  vehicle_vin?:   string;
  status?:        string;
  completed_at?:  string; // ISO date string
  revenue?:       number;
  pay_type?:      string;
  carrier_name?:  string;
  agent_name?:    string;
}

/** A single row-level validation error */
export interface RowError {
  row:     number;
  field:   string;
  message: string;
  value?:  string;
}

/** Result from processing the full CSV */
export interface ImportResult {
  total:    number;
  inserted: number;
  skipped:  number;
  errors:   RowError[];
}

/**
 * Field mapping template: maps CSV header names → NormalizedRepairOrder keys.
 * Stored as JSONB in companies.field_mappings[templateName].
 * Example: { "RO #": "ro_number", "Customer": "customer_name" }
 */
export type FieldMappingTemplate = Record<string, keyof NormalizedRepairOrder>;

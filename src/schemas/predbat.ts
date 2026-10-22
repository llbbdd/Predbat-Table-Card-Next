import z from 'zod';

const HtmlEntitySchema = z.enum([
  '&searr;',
  '&nearr;',
  '&rarr;'
]);

const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const AdjustTypeSchema = z.enum([
  'copy',
  'future',
  'offset',
  'user',
  'manual',
  'increment',
  'saving',
  'unavailable'
]);

// Single row schema
const RawRowSchema = z.object({
  time: z.string(),
  slot_minute: z.number(),
  import_rate: z.number(),
  export_rate: z.number(),
  import_rate_adjust_type: AdjustTypeSchema.optional(),
  export_rate_adjust_type: AdjustTypeSchema.optional(),
  import_rate_adjusted: z.number(),
  export_rate_adjusted: z.number(),
  state: z.string(),
  state_target: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().nullable()
  ),
  state_override: z.string(),
  state_html: z.string(),
  state_text: z.string(),
  state_color: ColorSchema,
  state2_text: z.string().nullable(),
  state2_color: z.string().nullable(),
  show_limit: z.string(),
  pv_forecast: z.number().nullable(),
  pv_forecast10: z.number(),
  pv_forecast_total: z.number(),
  load_forecast: z.number(),
  load_forecast10: z.number(),
  load_forecast_total: z.number(),
  clipped: z.number(),
  rate_color_import: ColorSchema,
  rate_color_export: ColorSchema,
  pv_color: ColorSchema,
  load_color: ColorSchema,
  soc_color: ColorSchema,
  cost_color: ColorSchema,
  clipped_color: ColorSchema,
  carbon_change: z.coerce.number().optional(),
  carbon_color: ColorSchema.optional(),
  carbon_intensity: z.coerce.number().optional(),
  carbon_intensity_color: ColorSchema.optional(),
  extra_load: z.coerce.number(),
  car_charging: z.number().optional(),
  iboost: z.number().optional(),
  iboost_change: z.number().optional(),
  iboost_color: ColorSchema.optional(),
  extra_load_total: z.number(),
  extra_color: ColorSchema, // ASK - relates to extra_load_total?
  soc_percent: z.number(),
  soc_change: z.number(),
  soc_sym: HtmlEntitySchema,
  cost_change: z.number(),
  rowspan_state: z.number(),
  skip_state_cell: z.boolean(),
  rowspan_limit: z.number(),
  skip_limit_cell: z.boolean(),
  split: z.boolean()
});

// Totals schema
const TotalsSchema = z.object({
  pv_forecast: z.number(),
  load_forecast: z.number(),
  clipped: z.number(),
  extra_load: z.coerce.number(),
  soc_percent: z.number()
});

// Main raw data schema
export const PredbatRawDataSchema = z.object({
  rows: z.array(RawRowSchema).transform((rows) =>
    rows.map((row) => ({
      ...row,
      cost_change: row.cost_change * 100 // ASK - predbat bug - convert pounds to pence
    }))
  ),
  import_cost_threshold: z.number(),
  export_cost_threshold: z.number(),
  currency_symbols: z.tuple([z.string(), z.string()]),
  soc: z.number(),
  soc_max: z.number(),
  reserve: z.number(),
  time: z.string(),
  mode: z.string(),
  plan_debug: z.boolean(),
  forecast_minutes: z.number(),
  end_record: z.number(),
  end_plan: z.number(),
  num_cars: z.number(),
  iboost_enable: z.boolean(),
  carbon_enable: z.boolean(),
  manual_load_value: z.number(),
  totals: TotalsSchema,
  timestamp: z.string()
});

export type PredbatRowData = {
  'load-column': { value: RawRow['load_forecast']; colour: string } | null;
  'import-column': { value: RawRow['import_rate']; colour: string } | null;
  'export-column': { value: RawRow['export_rate']; colour: string } | null;
  'pv-column': { value: RawRow['pv_forecast']; colour: string } | null;
  'state-column': { value: RawRow['state']; colour: string } | null;
  'limit-column': { value: number | null; colour: string } | null;
  'soc-column': { value: RawRow['soc_percent']; change: 'rising' | 'same' | 'falling'; colour: string } | null;
  'cost-column': { value: RawRow['cost_change']; change: 'rising' | 'same' | 'falling'; colour: string } | null;
  'car-column': { value: RawRow['car_charging']; colour: string } | null;
  'clip-column': { value: RawRow['clipped']; colour: string } | null;
  'iboost-column': { value: RawRow['iboost']; colour: string } | null;
  'net-energy-column': { value: number; colour: string } | null;
  'co2kg-column': { value: number; colour: string } | null;
  'xload-column': { value: number; colour: string } | null;
};

// Types
type RawRow = z.infer<typeof RawRowSchema>;
export type RawData = z.infer<typeof PredbatRawDataSchema>;
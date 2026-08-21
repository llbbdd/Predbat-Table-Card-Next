import z from 'zod';
import { Temporal } from '@js-temporal/polyfill';
import { fixTimezoneOffset, dateStringHasTimezoneOffset as stringHasTimezoneOffset } from '../utils/general-utils';
import { dayStart } from '../constants';

const UTCDateSchema = z.preprocess(
  (val) => {
    // istanbul ignore next
    if (typeof val !== 'string') {
      throw new Error(`Expected string, got ${typeof val}`);
    }

    // istanbul ignore next
    if (!val.endsWith('Z')) {
      throw new Error(`Expected UTC format ending with 'Z', got: ${val}`);
    }

    const instant = Temporal.Instant.from(val);
    return instant.toZonedDateTimeISO('UTC').toPlainDateTime();
  },
  z.custom<Temporal.PlainDateTime>((val) => val instanceof Temporal.PlainDateTime)
);

const PredbatDateSchema = z.preprocess(
  (val) => {
    // istanbul ignore next
    if (typeof val !== 'string') {
      throw new Error(`Expected string, got ${typeof val}`);
    }

    // istanbul ignore next
    if (!stringHasTimezoneOffset(val)) {
      throw new Error(`Expected date with timezone offset (e.g., +0100), got: ${val}`);
    }

    // Add colon to time offset if needed
    const fixed = fixTimezoneOffset(val);
    return Temporal.PlainDateTime.from(fixed);
  },
  z.custom<Temporal.PlainDateTime>((val) => val instanceof Temporal.PlainDateTime)
);

const resultsToTemporalMap = (results: Record<string, number>): Map<Temporal.PlainDateTime, number> | null => {
  if (Object.keys(results).length === 2) return null;

  const map = new Map<Temporal.PlainDateTime, number>();

  const now = Temporal.Now.plainDateTimeISO();
  const today = Temporal.PlainDateTime.from({
    year: now.year,
    month: now.month,
    day: now.day,
    ...dayStart
  });

  for (const [key, value] of Object.entries(results)) {
    try {
      const dateTime = PredbatDateSchema.parse(key);

      if (Temporal.PlainDateTime.compare(dateTime, today) >= 0) {
        map.set(dateTime, value);
      }
    }
    catch (error) {
      console.error(error);
    }
  }

  return map;
};

export const PredbatLoadEnergySchema = z.object({
  entity_id: z.literal('predbat.load_energy_predicted'),
  attributes: z.object({
    results: z.record(z.string(), z.number())
  }),
  last_updated: UTCDateSchema
}).transform((data) => ({
  entity_id: data.entity_id,
  results: resultsToTemporalMap(data.attributes.results),
  last_updated: data.last_updated
}));

const RatesBaseSchema = z.object({
  attributes: z.object({
    results: z.record(z.string(), z.number())
  }),
  last_updated: UTCDateSchema
});

export const PredbatImportRatesSchema = RatesBaseSchema.extend({
  entity_id: z.literal('predbat.rates')
}).transform((data) => ({
  entity_id: data.entity_id,
  results: resultsToTemporalMap(data.attributes.results),
  last_updated: data.last_updated
}));

export const PredbatExportRatesSchema = RatesBaseSchema.extend({
  entity_id: z.literal('predbat.rates_export')
}).transform((data) => ({
  entity_id: data.entity_id,
  results: resultsToTemporalMap(data.attributes.results),
  last_updated: data.last_updated
}));

export const PredbatPVForecastSchema = z.object({
  entity_id: z.literal('sensor.predbat_pv_forecast_raw'),
  attributes: z.object({
    relative_time: PredbatDateSchema,
    forecast: z.record(z.number(), z.number())
  }),
  last_updated: UTCDateSchema
}).transform((data) => ({
  entity_id: data.entity_id,
  relative_time: data.attributes.relative_time,
  results: data.attributes.forecast,
  last_updated: data.last_updated
}));

export const HtmlEntitySchema = z.enum([
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
  state_target: z.string().nullable(),
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
  rows: z.array(RawRowSchema),
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
  'limit-column': { value: string; colour: string } | null;
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
export type PredbatImportRates = z.infer<typeof PredbatImportRatesSchema>;
export type PredbatExportRates = z.infer<typeof PredbatExportRatesSchema>;
export type PredbatLoadEnergy = z.infer<typeof PredbatLoadEnergySchema>;
export type PredbatPVForecast = z.infer<typeof PredbatPVForecastSchema>;
export type RawRow = z.infer<typeof RawRowSchema>;
export type RawData = z.infer<typeof PredbatRawDataSchema>;
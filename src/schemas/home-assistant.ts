import { z } from 'zod';
import { allColumns, htmlPlanEntity } from '../constants';

const HistoryStateSchema = z.object({
  state: z.string(),
  last_changed: z.string()
});
export const HistoryStateArraySchema = z.array(HistoryStateSchema);

export const ValidEntityIdSchema = z.union([
  z.literal('update.predbat_table_card_update'),
  z.literal(htmlPlanEntity)
]);
export type ValidEntityId = z.infer<typeof ValidEntityIdSchema>;

export const ColumnKeySchema = z.enum(allColumns);
export type ColumnKey = z.infer<typeof ColumnKeySchema>;

export const PredbatTableCardConfigSchema = z.object({
  // Required
  type: z.literal('custom:predbat-card-next'),
  columns: z.array(ColumnKeySchema),

  // Optional with defaults
  grid_options: z.object({
    rows: z.union([z.number(), z.string()]).optional(),
    columns: z.union([z.number(), z.enum(['full'])]).optional()
  }).optional().default({}),

  // Optional
  weather_entity: z.string().optional(),
  car_charge_switch: z.enum(['on', 'off']).optional(),
  day_limit: z.number().refine(
    (val) => val > 0 && val < 14,
    { message: 'day_limit must be greater than 0 and less than 14, if defined' }
  ).optional().default(2),
  battery_lower_limit: z.number().refine(
    (val) => val > 0 && val < 100,
    { message: 'battery_lower_limit must be greater than 0 and less than 100, if defined' }
  ).optional().default(0),
  show_totals: z.boolean().optional().default(false)
});
export type PredbatTableCardConfig = z.infer<typeof PredbatTableCardConfigSchema>;

export const HassEntitySchema = z.object({
  entity_id: z.string(),
  state: z.string(),
  attributes: z.object({
    options: z.array(z.string()),
    installed_version: z.string(),
    latest_version: z.string(),
    html: z.string(),
    temperature: z.number(),
    temperature_unit: z.string(),
    precipitation: z.number(),
    next_rising: z.string(),
    next_setting: z.string(),
    unit_of_measurement: z.string(),
    friendly_name: z.string()
  }).catchall(z.unknown()),
  last_changed: z.string(),
  last_updated: z.string()
});
export type HassEntity = z.infer<typeof HassEntitySchema>;
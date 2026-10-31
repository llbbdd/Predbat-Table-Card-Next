import { z } from 'zod';
import { allColumns, htmlPlanEntity } from '../constants';
import { logger } from '../utils/logger';

export type ColumnKey = typeof allColumns[number];

const validColumns = new Set<string>(allColumns);

export const PredbatTableCardConfigSchema = z.object({
  // Required
  type: z.literal('custom:predbat-card-next'),
  columns: z
    .array(z.string())
    .transform((columns) =>
      columns.filter((column): column is ColumnKey => {
        if (validColumns.has(column)) return true;

        logger.warn(`Unknown column "${column}" — ignoring. Valid values: ${allColumns.join(', ')}`);

        return false;
      })
    ),
  entity: z.string().optional().default(htmlPlanEntity),

  // Optional with defaults
  grid_options: z.object({
    rows: z.union([z.number(), z.string()]).optional(),
    columns: z.union([z.number(), z.enum(['full'])]).optional()
  }).optional().default({}),

  // Optional
  weather_entity: z.string().optional(),
  iboost_history_entity: z.string().optional(),
  car_charge_switch: z.enum(['on', 'off']).optional(),
  day_limit: z.number().refine(
    (val) => val > 0 && val < 14,
    { message: 'day_limit must be greater than 0 and less than 14, if defined' }
  ).optional().default(2),
  battery_lower_limit: z.number().refine(
    (val) => val > 0 && val < 100,
    { message: 'battery_lower_limit must be greater than 0 and less than 100, if defined' }
  ).optional().default(0),
  show_totals: z.boolean().optional().default(false),
  max_import_export_value_for_colour_scale: z.number().refine(
    (val) => val > 0,
    { message: 'max_import_export_value_for_colour_scale must be greater than 0, if defined' }
  ).optional().default(100)
});

export type HassEntity = {
  entity_id: string;
  state: string;
  attributes: {
    options: string[];
    installed_version: string;
    latest_version: string;
    html: string;
    temperature: number;
    temperature_unit: string;
    precipitation: number;
    next_rising: string;
    next_setting: string;
    unit_of_measurement: string;
    friendly_name: string;
  } & Record<string, unknown>;
  last_changed: string;
  last_updated: string;
};
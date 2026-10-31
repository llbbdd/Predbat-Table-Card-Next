import z from 'zod';
import { ColumnKey, PredbatTableCardConfigSchema } from '../schemas/home-assistant';
import { PredbatTableCardConfig } from '../types/home-assistant';
import { logger } from './logger';

export class ConfigManager {
  private _config: PredbatTableCardConfig | null;

  public constructor() {
    this._config = null;
  }

  public set config(config: PredbatTableCardConfig) {
    try {
      // Zod strips unexpected keys silently, so manually scan and warn
      const knownKeys = new Set(Object.keys(PredbatTableCardConfigSchema.shape));
      const receivedKeys = Object.keys(config);

      for (const key of receivedKeys) {
        if (!knownKeys.has(key)) {
          logger.warn(`Unexpected config key "${key}" — ignoring. Valid keys: ${[...knownKeys].join(', ')}`);
        }
      }

      // Validate with schema
      const validatedConfig = PredbatTableCardConfigSchema.parse(config);

      // Set config
      this._config = validatedConfig;
    }
    catch (error) {
      logger.error('Config validation failed', error);

      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          logger.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`, { code: issue.code });
        }
      }
    }
  }

  public get config(): PredbatTableCardConfig {
    if (this._config === null) throw new Error('Config data not received');

    return this._config;
  }

  public get maxImportExportValueForColourScale(): number {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.max_import_export_value_for_colour_scale;
  }

  public get carChargeSwitch(): 'on' | 'off' | undefined {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.car_charge_switch;
  }

  public get planEntity(): string {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.entity;
  }

  public get weatherEntity(): string | undefined {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.weather_entity;
  }

  public get iboostHistoryEntity(): string | undefined {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.iboost_history_entity;
  }

  public get dayLimit(): number {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.day_limit;
  }

  public get batteryLowerLimit(): number {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.battery_lower_limit;
  }

  public get showTotals(): boolean {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.show_totals;
  }

  public get visibleColumns(): ColumnKey[] {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.columns;
  }
}
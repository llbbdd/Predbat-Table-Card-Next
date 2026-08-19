import { ColumnKey, PredbatTableCardConfigSchema } from '../schemas/home-assistant';
import { PredbatTableCardConfig } from '../types/home-assistant';

export class ConfigManager {
  private _config: PredbatTableCardConfig | null;

  public constructor() {
    this._config = null;
  }

  public set config(config: PredbatTableCardConfig) {
    try {
      const validatedConfig = PredbatTableCardConfigSchema.parse(config);

      this._config = validatedConfig;
    }
    catch(error) {
      console.error(error);
    }
  }

  public get config(): PredbatTableCardConfig {
    if (this._config === null) throw new Error('Config data not received');

    return this._config;
  }

  public get carChargeSwitch(): 'on' | 'off' | undefined {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.car_charge_switch;
  }

  public get weatherEntity(): string | undefined {
    if (this._config === null) throw new Error('Config data not received');

    return this._config.weather_entity;
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
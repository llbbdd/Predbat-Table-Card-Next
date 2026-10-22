import { PredbatData } from '../PredbatData';
import { HassEntity } from '../schemas/home-assistant';
import { PredbatRawDataSchema } from '../schemas/predbat';
import type { EntityObject, HomeAssistant, SoftwareVersion, Sun } from '../types/home-assistant';
import { cleanAndValidateVersion } from '../utils/general-utils';
import { logger } from '../utils/logger';

export class HomeAssistantService {
  private _hass: HomeAssistant | null = null;
  private _dayLimit: number | null = null;
  private _lastPlanUpdated: string | null = null;

  // Accept new HomeAssistant data
  public set hass(newHass: HomeAssistant) {
    this._hass = newHass;
  }

  public set dayLimit(dayLimit: number) {
    this._dayLimit = dayLimit;
  }

  public get generatingPlan(): boolean {
    return this.getState('switch.predbat_active').state === 'on';
  }

  public get sun(): Sun {
    const sunObject = this.getState('sun.sun');

    return {
      attributes: {
        next_rising: sunObject.attributes.next_rising,
        next_setting: sunObject.attributes.next_setting
      }
    };
  }

  public getState(entityId: string): HassEntity {
    if (this._hass === null) throw new Error('this._hass is null');
    if (this._hass.states[entityId] === undefined) throw new Error(`${entityId} is null`);

    return this._hass.states[entityId];
  }

  public getAllState(): Record<string, HassEntity | undefined> {
    if (this._hass === null) throw new Error('this._hass is null');

    return this._hass.states;
  }

  public getPredbatData(planEntity: string, iboostHistory: Map<string, number> | null = null): PredbatData | null {
    const planHtml = this._hass?.states[planEntity];
    const historicEntity = this._hass?.states['predbat.cost_yesterday'];

    if (planHtml === undefined) {
      throw new Error(`${planEntity} not found in hass.states`);
    }

    if (planHtml.attributes.raw === undefined) {
      throw new Error(`${planEntity}.attributes.raw is undefined (attributes: ${Object.keys(planHtml.attributes).join(', ')})`);
    }

    if (historicEntity === undefined) {
      throw new Error('predbat.cost_yesterday not found in hass.states');
    }

    if (historicEntity.attributes.json === undefined) {
      throw new Error(`predbat.cost_yesterday.attributes.json is undefined (attributes: ${Object.keys(historicEntity.attributes).join(', ')})`);
    }

    const validatedPlanData = PredbatRawDataSchema.parse(planHtml.attributes.raw);
    const validatedHistoricPlanData = PredbatRawDataSchema.parse(historicEntity.attributes.json);

    return new PredbatData(validatedHistoricPlanData, validatedPlanData, iboostHistory);
  }

  public callSelectOptionService = async (entity_id: string, option: string): Promise<void> => {
    if (this._hass === null) throw new Error('this._hass is null');

    return this._hass.callService('select', 'select_option', {
      entity_id: entity_id,
      option: option
    });
  };

  public callInputNumberSetService = async (entity_id: string, value: string): Promise<void> => {
    if (this._hass === null) throw new Error('this._hass is null');

    return this._hass.callService('input_number', 'set_value', {
      entity_id: entity_id,
      value: value
    });
  };

  public async fetchIboostHistory(entityId: string): Promise<Map<string, number>> {
    if (this._hass === null) throw new Error('this._hass is null');

    const startOfToday = Temporal.Now.plainDateTimeISO().with({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0
    });

    const startTime = startOfToday.toZonedDateTime(Temporal.Now.timeZoneId()).toInstant().toString();
    const endTime = Temporal.Now.instant().toString();

    let raw: unknown;

    try {
      raw = await this._hass.connection.sendMessagePromise({
        type: 'history/history_during_period',
        start_time: startTime,
        end_time: endTime,
        entity_ids: [entityId],
        no_attributes: true
      });
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.warn(`fetchIboostHistory: recorder query failed for ${entityId}: ${message}`, error);

      return new Map<string, number>();
    }

    const result = new Map<string, number>();

    if (raw === null || typeof raw !== 'object') return result;

    const entityHistory = (raw as Record<string, unknown>)[entityId];

    if (!Array.isArray(entityHistory)) return result;

    // Parse into [PlainDateTime, cumulative value] pairs
    const readings: { time: Temporal.PlainDateTime, value: number }[] = [];

    for (const entry of entityHistory) {
      if (entry === null || typeof entry !== 'object') continue;

      const stateObj = entry as {
        state?: unknown,
        last_changed?: unknown,
        s?: unknown,
        lc?: unknown,
        lu?: unknown
      };

      // `no_attributes: true` forces the abbreviated shape { s, a, lu }.
      // Handle both that and the full shape { state, last_changed } for robustness.
      const stateValue = stateObj.state ?? stateObj.s;

      let instant: Temporal.Instant | null = null;

      if (typeof stateObj.last_changed === 'string') {
        instant = Temporal.Instant.from(stateObj.last_changed);
      }
      else if (typeof stateObj.lc === 'string') {
        instant = Temporal.Instant.from(stateObj.lc);
      }
      else if (typeof stateObj.lu === 'number') {
        // `lu` is Unix epoch seconds as a float; Temporal requires an integer millisecond value
        instant = Temporal.Instant.fromEpochMilliseconds(Math.round(stateObj.lu * 1000));
      }

      if (typeof stateValue !== 'string' || instant === null) continue;

      const numericValue = Number(stateValue);

      if (Number.isNaN(numericValue)) continue;

      readings.push({
        time: instant.toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDateTime(),
        value: numericValue
      });
    }

    readings.sort((a, b) => Temporal.PlainDateTime.compare(a.time, b.time));

    if (readings.length < 2) return result;

    const now = Temporal.Now.plainDateTimeISO();

    // For each adjacent pair, the delta belongs to the slot containing the earlier reading.
    // If the counter reset mid-day (value dropped), treat the new value as the delta.
    for (let i = 1; i < readings.length; i++) {
      const prev = readings[i - 1];
      const curr = readings[i];

      let delta = curr.value - prev.value;
      if (delta < 0) delta = curr.value;

      const slotStart = prev.time.with({
        minute: prev.time.minute < 30 ? 0 : 30,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0
      });

      // Only emit historic slots
      if (Temporal.PlainDateTime.compare(slotStart, now) >= 0) continue;

      // Accumulate into the slot (multiple readings within one slot sum up)
      const existing = result.get(slotStart.toString()) ?? 0;
      result.set(slotStart.toString(), existing + delta);
    }

    return result;
  }

  private _getVersions(entityId: 'update.predbat_version' | 'update.predbat_table_card_update'): SoftwareVersion {
    try {
      const versionEntityAttributes = this.getState(entityId);
      const installed = cleanAndValidateVersion(versionEntityAttributes.attributes.installed_version);
      const latest = cleanAndValidateVersion(versionEntityAttributes.attributes.latest_version);

      return { installed, latest };
    }
    catch {
      return { installed: null, latest: null };
    }
  }

  public getHomeAssistantVersions(): SoftwareVersion {
    return this._getVersions('update.predbat_version');
  }

  public getCardVersions(): SoftwareVersion {
    const tempVersion = this._getVersions('update.predbat_table_card_update');

    if (tempVersion.installed === null) {
      // Version is provided by HACS, so fall back to package.json for development environment
      if (process.env.NODE_ENV !== 'development') throw new Error('Card version not received from update.predbat_table_card_update');
      if (process.env.PREDBAT_VERSION === undefined) throw new Error('PREDBAT_VERSION env var not set');

      tempVersion.installed = process.env.PREDBAT_VERSION;
    }

    return tempVersion;
  }

  public getOverrideEntities(): EntityObject[] {
    return [
      { entityName: 'select.predbat_manual_demand', entityIcon: 'home-lightning-bolt', entityTitle: 'Force Demand' },
      { entityName: 'select.predbat_manual_charge', entityIcon: 'battery-plus', entityTitle: 'Force Charge' },
      { entityName: 'select.predbat_manual_freeze_charge', entityIcon: 'battery-plus', entityTitle: 'Prevent Charge' },
      { entityName: 'select.predbat_manual_export', entityIcon: 'transmission-tower-import', entityTitle: 'Force Export' },
      { entityName: 'select.predbat_manual_freeze_export', entityIcon: 'transmission-tower-import', entityTitle: 'Prevent Export' },
      { entityName: 'select.predbat_manual_soc', entityIcon: 'percent', entityTitle: 'Force SoC' }
    ];
  }
}

// TODO - relies on predbat (docker or ????) and octopus energy integration
export declare const process: {
  env: {
    PREDBAT_VERSION?: string;
    NODE_ENV?: string;
  };
};

import { HassEntity, HistoryStateArraySchema } from '../schemas/home-assistant';
import type { EntityObject, HistoryState, HomeAssistant, SoftwareVersion, Sun } from '../types/home-assistant';
import { cleanAndValidateVersion } from '../utils/general-utils';
import { PredbatData } from '../PredbatData';

export class HomeAssistantService {
  private _hass: HomeAssistant | null = null;
  private _predbatData: PredbatData | null = null;
  private _dayLimit: number | null = null;

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

  public async fetchEntityHistory(entityId: string, hours = 1): Promise<HistoryState[]> {
    if (this._hass === null) throw new Error('this._hass is null');

    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600 * 1000);
    const path = `history/period/${start.toISOString()}?end_time=${end.toISOString()}&filter_entity_id=${entityId}&minimal_response=1&significant_changes_only=1&no_attributes`;
    const data: unknown = await this._hass.callApi('GET', path);

    try {
      return HistoryStateArraySchema.parse(data);
    }
    catch {
      return [];
    }
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

  public get predbatData(): PredbatData {
    if (this._predbatData === null) throw new Error('this._predbatData is null');

    return this._predbatData;
  }

  private async _callService(domain: string, service: string, entity_id: string, option: string): Promise<void> {
    if (this._hass === null) throw new Error('this._hass is null');

    return this._hass.callService(domain, service, {
      entity_id: entity_id,
      option: option
    });
  }

  public callSelectOptionService = async (entity_id: string, option: string): Promise<void> => {
    return this._callService('select', 'select_option', entity_id, option);
  };

  public callInputNumberSetService = async (entity_id: string, option: string): Promise<void> => {
    return this._callService('input_number', 'set_value', entity_id, option);
  };

  private _getVersions(entityId: 'update.predbat_version' | 'update.predbat_table_card_update'): SoftwareVersion {
    if (process.env.NODE_ENV === 'development') {
      return { installed: null, latest: null };
    }

    const versionEntityAttributes = this.getState(entityId);
    const installed = cleanAndValidateVersion(versionEntityAttributes.attributes.installed_version);
    const latest = cleanAndValidateVersion(versionEntityAttributes.attributes.latest_version);

    return { installed, latest };
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
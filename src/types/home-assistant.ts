import type { Connection } from 'home-assistant-js-websocket';
import type { weekdayMap } from '../constants';
import z from 'zod';
import { ColumnKey, HassEntity, PredbatTableCardConfigSchema } from '../schemas/home-assistant';
import { PredbatExportRates, PredbatImportRates, PredbatLoadEnergy, PredbatPVForecast } from '../schemas/predbat';

declare global {
  export interface HTMLElementTagNameMap {
    'ha-icon': HaIcon;
  }
}

export interface HomeAssistant {
  states: Record<string, HassEntity | undefined>;
  themes: {
    darkMode: boolean;
  };
  connection: Connection;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<void>;
  callApi(method: string, path: string): Promise<unknown>;
  localize(key: string, ...args: unknown[]): string;
  config: {
    unit_system: {
      temperature: string;
    };
  };
}

export interface CustomCard {
  type: string;
  name: string;
  preview: boolean;
  description: string;
  documentationURL: string;
}

declare global {
  export interface Window {
    customCards: CustomCard[];
  }
}

export type EntityObject = {
  entityName: string;
  entityIcon: string;
  entityTitle: string;
};

export type CellValue = {
  value: string;
  colour: string;
  adjustType?: AdjustType;
  preSymbol?: string;
  postSymbol?: string;
};

export type WeekdayKey = keyof typeof weekdayMap;

export interface Forecast {
  datetime: string;
  temperature: number;
  condition: string;
  precipitation: number;
}

export type WeatherIcon =
  | 'weather-partly-cloudy'
  | 'weather-night-partly-cloudy'
  | 'weather-night'
  | 'weather-sunny'
  | 'weather-cloudy'
  | 'alert-outline'
  | 'weather-fog'
  | 'weather-hail'
  | 'weather-lightning'
  | 'weather-lightning-rainy'
  | 'weather-pouring'
  | 'weather-snowy'
  | 'weather-snowy-rainy'
  | 'weather-windy'
  | 'weather-windy-variant'
  | 'cloud-question';

export interface HaIcon extends HTMLElement {
  icon: string;
  style: CSSStyleDeclaration;
}

export interface HistoryState {
  state: string;
  last_changed: string;
}

export interface Schema {
  name: string;
}

export interface HuiErrorCard extends HTMLElement {
  setConfig(config: { type: string; error: string; origConfig: PredbatTableCardConfig | undefined }): void;
}

export type Sun = { attributes: { next_rising: string, next_setting: string } };

export type PredbatTableCardConfig = z.infer<typeof PredbatTableCardConfigSchema>;

export type AdjustType =
  | 'copy'          // Copied from previous day
  | 'future'        // Estimated using future rate data
  | 'offset'        // Modified by rate offset
  | 'user'          // User-defined override
  | 'manual'        // Manual override
  | 'increment'     // Incremental adjustment
  | 'saving'        // Special savings event
  | 'unavailable'   // No data available
  | undefined;      // Rate is original/real data

export type TemperatureUnit = '°F' | '°C';

export type StubConfig = {
  'columns': ColumnKey[]
};

export interface PredbatState {
  loadEnergy: PredbatLoadEnergy | null,
  importRates: PredbatImportRates| null,
  exportRates: PredbatExportRates| null,
  pvForecast: PredbatPVForecast | null
}

export type SoftwareVersion = { installed: string | null, latest: string | null };
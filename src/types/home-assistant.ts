import type { Connection } from 'home-assistant-js-websocket';
import z from 'zod';
import { ColumnKey, HassEntity, PredbatTableCardConfigSchema } from '../schemas/home-assistant';

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

interface CustomCard {
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

export interface HaIcon extends HTMLElement {
  icon: string;
  style: CSSStyleDeclaration;
}

export interface Schema {
  name: string;
}

export type Sun = { attributes: { next_rising: string, next_setting: string } };

export type PredbatTableCardConfig = z.infer<typeof PredbatTableCardConfigSchema>;

export type TemperatureUnit = '°F' | '°C';

export type StubConfig = {
  'columns': ColumnKey[]
};

export type SoftwareVersion = { installed: string | null, latest: string | null };
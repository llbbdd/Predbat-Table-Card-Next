interface CustomCard {
  type: string;
  name: string;
  preview: boolean;
  description: string;
  documentationURL: string;
}

declare global {
  interface Window {
    customCards: CustomCard[];
  }
}

interface HassEntity {
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  entity_id: string;
}

type EntityObject = {
  entityName: string;
  entityIcon: string;
  entityTitle: string;
};

interface RawRow {
  time: string;
  pv_forecast: number | null;
  soc_percent: number;
  load_forecast: number;
  state: string;
  cost_change: number;
  soc_change: number;
  import_rate: number;
  export_rate: number;
  state_target: number;
  total_cost: number;
  car_charging?: number;
  clipped?: number;
  iboost?: number;
}

interface RawData {
  rows: RawRow[];
}

type ColumnKey =
  | 'time-column'
  | 'import-column'
  | 'export-column'
  | 'state-column'
  | 'limit-column'
  | 'pv-column'
  | 'load-column'
  | 'soc-column'
  | 'clip-column'
  | 'car-column'
  | 'iboost-column'
  | 'co2kg-column'
  | 'co2kwh-column'
  | 'cost-column'
  | 'total-column'
  | 'xload-column'
  | 'import-export-column'
  | 'net-power-column'
  | 'weather-column'
  | 'rain-column'
  | 'temp-column'
  | 'options-column'
  | 'options-popup-column';

type CellValue = { value: any; color: string };

type RowData = {
  'time-column'?: { value: string; color: string };
  'import-column'?: CellValue;
  'export-column'?: CellValue;
  'state-column'?: CellValue;
  'limit-column'?: CellValue;
  'pv-column'?: CellValue;
  'load-column'?: CellValue;
  'soc-column'?: CellValue;
  'cost-column'?: CellValue;
  'total-column'?: CellValue;
  'car-column'?: CellValue;
  'co2kg-column'?: CellValue;
  'co2kwh-column'?: CellValue;
  'clip-column'?: CellValue;
  'iboost-column'?: CellValue;
  'xload-column'?: CellValue;
  'options-column'?: CellValue;
  'net-power-column'?: CellValue;
  'weather-column'?: CellValue;
  'options-popup-column'?: CellValue;
  'import-export-column'?: CellValue;
  'temp-column'?: CellValue;
  'rain-column'?: CellValue;
};

interface ColumnDescription {
  description: string;
  smallDescription: string;
}

const weekdayMap = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
} as const;

type WeekdayKey = keyof typeof weekdayMap;

interface Forecast {
  datetime: string;
  temperature?: number;
  condition?: string;
  precipitation_probability?: number;
  [key: string]: any;
}

type WeatherCondition =
  | "partlycloudy"
  | "partlycloudynight"
  | "clear-night"
  | "sunny"
  | "cloudy"
  | "exceptional"
  | "fog"
  | "hail"
  | "lightning"
  | "lightning-rainy"
  | "pouring"
  | "snowy"
  | "snowy-rainy"
  | "windy"
  | "windy-variant"
  | "rainy";

type WeatherIcon =
  | "weather-partly-cloudy"
  | "weather-night-partly-cloudy"
  | "weather-night"
  | "weather-sunny"
  | "weather-cloudy"
  | "alert-outline"
  | "weather-fog"
  | "weather-hail"
  | "weather-lightning"
  | "weather-lightning-rainy"
  | "weather-pouring"
  | "weather-snowy"
  | "weather-snowy-rainy"
  | "weather-windy"
  | "weather-windy-variant"
  | "cloud-question";

interface HaIcon extends HTMLElement {
  icon?: string;
  style: CSSStyleDeclaration;
}

interface Hass {
  themes: any;
  connection: any;
  callService(domain: string, service: string, data: Record<string, any>): Promise<void>;
  formatEntityState(weatherEntity: any, condition: any): unknown;
  localize(arg0: string): any;
  config: any;
  states: any;
  callApi(method: string, path: string): Promise<unknown>;
}

interface HistoryState {
  state: string;
  last_changed: string;
}

interface PredbatTableCardConfig {
  font_size: undefined;
  table_width: undefined;
  even_row_colour_light: undefined;
  odd_row_colour_light: undefined;
  even_row_colour: undefined;
  odd_row_colour: any;
  reset_day_totals: any;
  old_skool: any;
  old_skool_columns: any;
  debug_columns: string;
  force_single_line: any;
  debug_prices_only: boolean;
  stack_pills: boolean;
  battery_capacity: string;
  fill_empty_cells: boolean;
  use_friendly_states: boolean;
  row_limit: number;
  show_totals: boolean;
  show_plan_totals: boolean;
  hide_empty_columns: boolean;
  path_for_click: string;
  hide_last_update: boolean;
  show_predbat_version: boolean;
  show_tablecard_version: boolean;
  car_charge_switch: any;
  entity: string;
  light_mode: "auto" | "light" | "dark";
  columns: ColumnKey[];
  weather_entity?: string;
  show_day_totals: boolean
}

interface Schema {
  name: string;
}

interface HuiErrorCard extends HTMLElement {
  setConfig(config: { type: string; error: string | null; origConfig: PredbatTableCardConfig | undefined }): void;
}

async function fetchEntityHistory(hass: Hass, entityId: string, hours = 1) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 3600 * 1000);
  const path = `history/period/${start.toISOString()}?end_time=${end.toISOString()}&filter_entity_id=${entityId}&minimal_response=1&significant_changes_only=1&no_attributes`;
  const data = await hass.callApi("GET", path);
  return (Array.isArray(data) && data[0]) ? data[0] : [];
}

function getLastCompletedOnRun(history: HistoryState) {
  if (!Array.isArray(history) || history.length < 2) return null;

  for (let offIdx = history.length - 1; offIdx >= 0; offIdx--) {
    if (history[offIdx].state !== 'off') continue;

    for (let onIdx = offIdx - 1; onIdx >= 0; onIdx--) {
      const s = history[onIdx].state;
      if (s === 'on') {
        const start = new Date(history[onIdx].last_changed);
        const end = new Date(history[offIdx].last_changed);
        const ms = end.getTime() - start.getTime();
        return ms > 0 ? { ms, start, end } : null;
      }
      if (s === 'off') break;
    }
  }
  return null;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}


class PredbatTableCard extends HTMLElement {
  // The user supplied configuration. Throw an exception and Home Assistant
  // will render an error card.

  private config?: PredbatTableCardConfig;
  forecast: never[];
  unsubscribe: (() => void) | null = null;

  private _renderErrorMessage: string | null;
  content: HTMLDivElement | null = null;
  private _hass: Hass | undefined = undefined;
  initialized = false;
  weatherEntityId: string | null = null;
  private _lastOnText: string | null = null;

  setConfig(config: PredbatTableCardConfig) {
    if (!config.entity) {
      throw new Error("You need to set the predbat entity");
    }
    if (!config.columns) {
      throw new Error("You need to define a list of columns (see docs)");
    } else if ((config.columns.includes("weather-column") || config.columns.includes("temp-column") || config.columns.includes("rain-column")) && !config.weather_entity) {
      throw new Error("To use weather or temp columns you need to include a weather_entity in your YAML");
    }

    this.config = config;
  }

  // Let HA know which editor element to use
  /*
  static getConfigElement() {
    return document.createElement('predbat-card-editor');
  }
  */

  static getConfigForm() {
    return {
      schema: [
        {
          name: "help_text",
          type: "constant",
          value: "",
        },
        {
          name: "entity",
          required: true,
          selector: {
            entity: {}
          },
          default: "predbat.plan_html",
        },
        {
          name: "",
          title: "General Card Settings",
          type: "expandable",
          schema: [
            { name: "fill_empty_cells", selector: { boolean: {} } },
            { name: "show_day_totals", selector: { boolean: {} } },
            { name: "show_plan_totals", selector: { boolean: {} } },
            { name: "show_predbat_version", selector: { boolean: {} } },
            { name: "show_tablecard_version", selector: { boolean: {} } },
            { name: "hide_last_update", selector: { boolean: {} } },
            { name: "hide_empty_columns", selector: { boolean: {} } },
            { name: "use_friendly_states", selector: { boolean: {} } },
            { name: "stack_pills", selector: { boolean: {} } },
            { name: "debug_prices_only", selector: { boolean: {} } },
            { name: "reset_day_totals", selector: { boolean: {} } },
            {
              name: "row_limit",
              selector: {
                number: {
                  min: 1,
                  max: 400,
                  step: 1,                 // allows fractional values (e.g. 12.5)
                  mode: "box",               // shows a numeric input box instead of slider
                },
              },
              default: 100,
            },
            {
              name: "battery_capacity",
              selector: {
                number: {
                  min: 1,
                  mode: "box", // shows a numeric input box instead of slider
                  step: 0.01,
                  unit_of_measurement: "kWh",
                },
              },
            },
          ]
        },
        {
          name: "",
          title: "Card Style Settings",
          type: "expandable",
          schema: [
            {
              name: "table_width",
              selector: { number: { min: 10, max: 100, step: 1, unit_of_measurement: "%" } },
              default: 100,   // starting value
            },
            { name: "old_skool", selector: { boolean: {} }, default: false },
            {
              name: 'old_skool_columns',
              selector: {
                select: {
                  multiple: true,
                  mode: 'dropdown',
                  options: [
                    { value: 'time-column', label: 'Time' },
                    { value: 'import-column', label: 'Import' },
                    { value: 'export-column', label: 'Export' },
                    { value: 'import-export-column', label: 'Import & Export' },
                    { value: 'load-column', label: 'Load' },
                    { value: 'pv-column', label: 'PV' },
                    { value: 'state-column', label: 'State' },
                    { value: 'soc-column', label: 'SoC' },
                    { value: 'limit-column', label: 'Limit' },
                    { value: 'cost-column', label: 'Cost' },
                    { value: 'total-column', label: 'Total Cost' },
                    { value: 'car-column', label: 'Car' },
                    { value: 'iboost-column', label: 'iBoost' },
                    { value: 'co2kwh-column', label: 'CO2 kWh' },
                    { value: 'co2kg-column', label: 'CO2 KG' },
                    { value: 'xload-column', label: 'X-Load' },
                    { value: 'clip-column', label: 'Clip' },
                    { value: 'net-power-column', label: 'Net Power' },
                    { value: 'options-popup-column', label: 'Popup Overrides' },
                    { value: 'options-column', label: 'Overrides' },
                  ],
                },
              },
            },
            {
              name: "font_size",
              selector: {
                number: {
                  min: 8,
                  max: 32,
                  step: 0.1,                 // allows fractional values (e.g. 12.5)
                  mode: "box",               // shows a numeric input box instead of slider
                  unit_of_measurement: "px", // optional, just a label suffix
                },
              },
              default: 14,
            },
            {
              name: "light_mode",
              selector: {
                select: {
                  multiple: false,
                  options: [
                    { value: 'auto', label: 'Automatic' },
                    { value: 'light', label: 'Light Mode' },
                    { value: 'dark', label: 'Dark Mode' },
                  ],
                },
              },
            },
            {
              name: "color_help_text",
              type: "constant",
              value: "",
            },
            {
              name: "",
              type: "grid",
              schema: [
                {
                  name: "odd_row_colour",
                  selector: {
                    text: {
                      type: "text",
                    }
                  },
                  default: "#ffffff"
                },
                {
                  name: "even_row_colour",
                  selector: {
                    text: {
                      type: "text",
                    }
                  },
                  default: "#ffffff"
                },
                {
                  name: "odd_row_colour_light",
                  selector: {
                    text: {
                      type: "text",
                    }
                  },
                  default: "#ffffff"
                },
                {
                  name: "even_row_colour_light",
                  selector: {
                    text: {
                      type: "text",
                    }
                  },
                  default: "#ffffff"
                },
              ]
            },
            {
              name: "color_help_text_more",
              type: "constant",
              value: "",
            },
          ]
        },
        {
          name: "",
          title: "Predbat Debug Settings",
          type: "expandable",
          schema: [
            {
              name: 'debug_columns',
              selector: {
                select: {
                  multiple: true,
                  mode: 'dropdown',
                  options: [
                    { value: 'time-column', label: 'Time' },
                    { value: 'import-column', label: 'Import' },
                    { value: 'export-column', label: 'Export' },
                    { value: 'import-export-column', label: 'Import & Export' },
                    { value: 'load-column', label: 'Load' },
                    { value: 'pv-column', label: 'PV' },
                    { value: 'state-column', label: 'State' },
                    { value: 'soc-column', label: 'SoC' },
                    { value: 'limit-column', label: 'Limit' },
                    { value: 'cost-column', label: 'Cost' },
                    { value: 'total-column', label: 'Total Cost' },
                    { value: 'car-column', label: 'Car' },
                    { value: 'iboost-column', label: 'iBoost' },
                    { value: 'co2kwh-column', label: 'CO2 kWh' },
                    { value: 'co2kg-column', label: 'CO2 KG' },
                    { value: 'xload-column', label: 'X-Load' },
                    { value: 'clip-column', label: 'Clip' },
                    { value: 'net-power-column', label: 'Net Power' },
                    { value: 'options-popup-column', label: 'Popup Overrides' },
                    { value: 'options-column', label: 'Overrides' },
                  ],
                },
              },
            },
          ]
        },
        {
          name: "",
          title: "Advanced Settings",
          type: "expandable",
          schema: [
            { name: "weather_entity", selector: { entity: {} } },
            {
              name: "path_for_click",
              selector: {
                text: {
                  type: "text",
                }
              },
              default: "/my-dashboard/predbat-plan",
            },
          ]
        },
      ],
      computeLabel: (schema: Schema) => {
        if (schema.name === "entity") return "Predbat HTML Entity:";
        if (schema.name === "fill_empty_cells") return "Fill Empty Cells?";
        if (schema.name === "show_day_totals") return "Show Day Totals Row?";
        if (schema.name === "show_plan_totals") return "Show Plan Totals Row?";
        if (schema.name === "use_friendly_states") return "Use friendly STATE labels?";
        if (schema.name === "stack_pills") return "Stack Import/Export Pills?";
        if (schema.name === "old_skool") return "Use original Predbat Plan stylesheet? (old_skool mode)";
        if (schema.name === "old_skool_columns") return "Choose specific columns to use original Predbat Plan style";
        if (schema.name === "help_text") return "Important: You must manually set the columns in your card YAML";
        if (schema.name === "table_width") return "Table Width (%)";
        if (schema.name === "font_size") return "Font Size (px)";
        if (schema.name === "row_limit") return "Number of rows to return";
        if (schema.name === "show_predbat_version") return "Show Predbat version?";
        if (schema.name === "show_tablecard_version") return "Show Predbat Table Card version?";
        if (schema.name === "hide_last_update") return "Hide PLAN LAST UPDATED header?";
        if (schema.name === "hide_empty_columns") return "Hide empty columns?";
        if (schema.name === "battery_capacity") return "Battery Capacity";
        if (schema.name === "color_help_text") return "Row colour override settings";
        if (schema.name === "color_help_text_more") return "Override the HEX (e.g, #AA0000) colour values of the rows";
        if (schema.name === "light_mode") return "Card Light Mode";
        if (schema.name === "odd_row_colour") return "Dark Row Colour (odd)";
        if (schema.name === "odd_row_colour_light") return "Light Row Colour (odd)";
        if (schema.name === "even_row_colour") return "Dark Row Colour (even)";
        if (schema.name === "even_row_colour_light") return "Light Row Colour (even)";
        if (schema.name === "debug_prices_only") return "Show Debug Prices Only?";
        if (schema.name === "weather_entity") return "Weather Entity";
        if (schema.name === "path_for_click") return "Dashboard Path for click";
        if (schema.name === "reset_day_totals") return "Reset Total Cost at midnight?";

        return undefined;
      },
      computeHelper: (schema: Schema) => {
        switch (schema.name) {
          case "entity":
            return "Usually set to \"predbat.plan_html\"";
          case "fill_empty_cells":
            return "This setting fills the column with an icon to fill any empty space";
          case "stack_pills":
            return "Only works when old_skool mode is disabled in style settings";
          case "show_plan_totals":
            return "Show a new row of plan total values for each supported column";
          case "show_day_totals":
            return "Show a new row of day total values for each supported column";
          case "use_friendly_states":
            return "Attempts to make the STATE column more understandable";
          case "old_skool":
            return "Applies the style to the entire table card, aka old_skool setting. This setting always wins and overrides settings below.";
          case "old_skool_columns":
            return "Warning: This setting is overridden by the old_skool setting above. Turn that off if you want to set specific columns";
          case "help_text":
            return "some helpful text";
          case "table_width":
            return "Set the overall table width as a percentage.";
          case "font_size":
            return "Adjust the font size used in the table.";
          case "row_limit":
            return "Min: 1, Max: 400";
          case "show_predbat_version":
            return "Displays the Predbat version at the bottom of the table. Click to Upgrade (if available)";
          case "show_tablecard_version":
            return "Displays the Predbat Table Card version at the bottom of the table. Click to Upgrade (if available)";
          case "hide_last_update":
            return "Hides the Plan Last Updated text at the top of the plan";
          case "hide_empty_columns":
            return "Hide columns where there are no values for the entire plan";
          case "battery_capacity":
            return "Shows the kWh capacity of your battery in the SoC column";
          case "debug_columns":
            return "Choose which columns reflect the HTML Debug Settings when enabled in Predbat";
          case "debug_prices_only":
            return "If you have enabled Predbat's HTML Plan debug, set to true to only show the adjusted prices, rather than the default (actual and adjusted prices). Important: Only works if HTML Plan debug is enabled";
          case "weather_entity":
            return "Add a weather forecast entity to see the weather for each time slot. Must add weather-column or temp-column to columns to see weather";
          case "path_for_click":
            return "Add a dashboard path like /my-dashboard/predbat-plan to be navigated to when you click the plan";
          case "reset_day_totals":
            return "Resets the total-column at midnight to £0.00 and increments by cost-column";
        }
        return undefined;
      },
    };
  }

  static getStubConfig() {
    return {
      "entity": "predbat.plan_html",
      "columns": [
        "time-column",
        "import-column",
        "export-column",
        "state-column",
        "limit-column",
        "pv-column",
        "load-column",
        "soc-column",
        "cost-column",
        "total-column"
      ],
      "table_width": 100,
      "fill_empty_cells": true
    }
  }

  static get properties() {
    return {
      _config: {},
      _hass: {},
    };
  }

  constructor() {
    super();
    //this.attachShadow({ mode: 'open' });
    this.forecast = [];
    this.unsubscribe = null;
    this._renderErrorMessage = null;
  }

  renderError(message: string | null) {
    const errorCard = document.createElement("hui-error-card") as HuiErrorCard;
    errorCard.setConfig({
      type: "error",
      error: message,
      origConfig: this.config,
    });
    this.innerHTML = "";
    this.appendChild(errorCard);
    this.content = null;
    this._renderErrorMessage = message;
  }

  // Whenever the state changes, a new `hass` object is set. Use this to
  // update your content.

  set hass(hass: Hass) {

    // Initialize the content if it's not there yet.
    if (!this.content) {
      this.innerHTML = `
        <ha-card>
          <div class="card-content" id="predbat-card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector("div");
    }

    const oldHass = this._hass;
    this._hass = hass;

    const entityId = this.config?.entity;
    if (!entityId) {
      this.renderError("Predbat HTML entity is not set in the card configuration.");
      return;
    }
    const currentEntityState = hass.states?.[entityId];
    if (!currentEntityState) {
      this.renderError(`Predbat HTML entity "${entityId}" is not available. Hit REFRESH when it is...`);
      return;
    }
    if (currentEntityState.state === "unavailable") {
      this.renderError("Predbat HTML entity is not currently available. Hit REFRESH when it is...");
      return;
    }
    const hadError = this._renderErrorMessage !== null;
    this._renderErrorMessage = null;

    if (this.config === undefined) throw new Error("this.config not set");

    const switchEntityId = this.config.car_charge_switch; // optional

    let prefix = getPrefix(this.config.entity);

    if (prefix === "sensor") prefix = "predbat";

    const predbatActiveEntityId = `switch.${prefix}_active`;

    if (oldHass === undefined) {
      // Render html on the first load
      if (!this.initialized && this.config.weather_entity) {

        this.weatherEntityId = this.config.weather_entity;

        const state = hass.states[this.weatherEntityId];
        const stateStr = state ? state.state : "unavailable";

        if (stateStr === "unavailable") {
          throw new Error("Weather entity seems to be incorrect or not available");
        } else {

          this.subscribeForecast();
          this.initialized = true;
        }
      }
      this._lastOnText = null;
      this.processAndRender(hass);
    } else {
      const oldEntityUpdateTime = oldHass.states?.[entityId]?.last_updated;
      const newEntityUpdateTime = hass.states?.[entityId]?.last_updated;
      let carSwitchChanged = false;
      let activeSwitchChanged = false;
      let manualForceChanged = false;

      if (predbatActiveEntityId && hass.states[predbatActiveEntityId] && oldHass.states[predbatActiveEntityId]) {
        const oldActive = oldHass.states[predbatActiveEntityId];
        const newActive = hass.states[predbatActiveEntityId];
        activeSwitchChanged = oldActive.last_updated !== newActive.last_updated;

        // If we just transitioned ON -> OFF, compute duration immediately
        if (activeSwitchChanged && oldActive.state === 'on' && newActive.state === 'off') {
          const start = new Date(oldActive.last_changed); // when it turned ON
          const end = new Date(newActive.last_changed); // when it turned OFF
          const ms = end.getTime() - start.getTime();
          this._lastOnText = ms > 0 ? formatDuration(ms) : '—';
        }
      }

      if (switchEntityId && hass.states[switchEntityId] && oldHass.states[switchEntityId]) {
        const oldSwitchTime = oldHass.states[switchEntityId].last_updated;
        const newSwitchTime = hass.states[switchEntityId].last_updated;
        carSwitchChanged = oldSwitchTime !== newSwitchTime;
      }

      const forceEntityObjects = this.getOverrideEntities();
      for (const forceEntity of forceEntityObjects) {
        // forceEntity.entityName
        const oldForce = oldHass.states[forceEntity.entityName].state;
        const newForce = hass.states[forceEntity.entityName].state;
        manualForceChanged = oldForce !== newForce;
        if (manualForceChanged) {
          break;
        }
      }

      if (hadError || oldEntityUpdateTime !== newEntityUpdateTime || carSwitchChanged || activeSwitchChanged || manualForceChanged) {
        this.processAndRender(hass);
      }
    }
  }

  async subscribeForecast() {
    if (this.unsubscribe || !this._hass) return;

    try {
      this.unsubscribe = await this._hass.connection.subscribeMessage(
        (event: { forecast: never[]; }) => {
          this.forecast = event.forecast || [];

          if (this._hass === undefined) throw new Error("_hass undefined");

          this.processAndRender(this._hass);
        },
        {
          type: 'weather/subscribe_forecast',
          entity_id: this.weatherEntityId,
          forecast_type: 'hourly' // or 'hourly'
        }
      );
    } catch (e) {
      console.error('Failed to subscribe to forecast:', e);
    }
  }

  async disconnectedCallback() {
    if (this.unsubscribe) {
      await this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async processAndRender(hass: Hass) {
    if (this.config === undefined) throw new Error("this.config not set");

    let prefix = getPrefix(this.config.entity);

    if (prefix === "sensor")
      prefix = "predbat";
    const predbatActiveEntityId = `switch.${prefix}_active`;

    if (this._lastOnText === null) {
      if (this._hass === undefined) throw new Error("_hass undefined");

      const history = await fetchEntityHistory(this._hass, predbatActiveEntityId, 1);
      const lastRun = getLastCompletedOnRun(history);

      if (lastRun) {
        this._lastOnText = formatDuration(lastRun.ms);
      } else {
        this._lastOnText = '—';
      }
    }

    const entityId = this.config.entity;

    const state = hass.states?.[entityId];
    if (!state) {
      this.renderError(`Predbat HTML entity "${entityId}" is not currently available. REFRESH when it is...`);
      return;
    }
    const stateStr = state.state;

    if (stateStr === "unavailable") {
      this.renderError("Predbat HTML entity is not currently available. Hit REFRESH when it is...");
      return;
    }

    let columnsToReturn = this.config.columns;
    let rawHTML = hass.states[entityId].attributes.html;

    const dataArray = this.getArrayDataFromHTML(rawHTML, hass.themes.darkMode);

    //const dataArray = this.getArrayDataFromRaw(hass.states[entityId].attributes.raw, hass.themes.darkMode);

    //filter out any columns not in the data
    columnsToReturn = columnsToReturn.filter(column => {
      if (column === "options-column" || column === "options-popup-column") return true;

      const firstDataArray = dataArray[0]
      if (firstDataArray === undefined) throw new Error("firstDataArray is undefined");

      return firstDataArray[column] !== undefined;
    });

    let theTable = document.createElement('table');
    theTable.setAttribute('id', 'predbat-table');
    theTable.setAttribute('cellpadding', '0px');
    let newTableHead = document.createElement('thead');

    // set out the data rows
    let newTableBody = document.createElement('tbody');

    let overallTotal: { [key: string]: number } = {};
    let dayTotal: { [key: string]: number } = {};
    let dayTotalCost = 0;
    const columnsWithTotals = ["load-column", "pv-column", "car-column", "iboost-column", "net-power-column",
      "cost-column", "total-column", "clip-column", "co2kwh-column", "co2kg-column", "xload-column", "limit-column"];

    // before we display the rows, lets drop any that the user doesnt want.

    if (this.config.row_limit && this.config.row_limit > 0)
      dataArray.length = this.config.row_limit;

    const useRefactor = true;

    // iterate through the data
    dataArray.forEach((item, index) => {

      let newRow = document.createElement('tr');

      let isMidnight = false;
      let currentCost: number;
      columnsToReturn.forEach((column, columnIndex) => { // Use arrow function here
        if (item[column] !== undefined) {
          if (item["time-column"] === undefined) throw new Error("item['time - column'] is undefined");

          if (item["time-column"].value.includes("23:30"))
            isMidnight = true;

          let newColumn;
          if (useRefactor) {
            newColumn = this.getCellTransformationRefactor(item[column], column, hass.themes.darkMode, index, item["time-column"]);
          }

          if (newColumn === undefined) throw new Error("newColumn undefined");

          newRow.appendChild(newColumn);

          if (column === "cost-column") {
            currentCost = parseFloat(item[column].value);
            if (isNaN(currentCost)) currentCost = 0;
          }

          if (columnsWithTotals.includes(column)) {

            if (column === "total-column") {
              let currentTotal = parseFloat(item[column].value.replace(/[^0-9.\-]/g, ""));
              if (isNaN(currentTotal)) currentTotal = 0;

              overallTotal[column] = (currentTotal * 100) + currentCost;

              if (isMidnight) {

                overallTotal[column] = (overallTotal[column] || 0) + (currentTotal * 100);
                dayTotal[column] = (currentTotal * 100) + currentCost;

              }
            } else {
              let val = parseFloat(item[column].value.replace(/[⚊↘↗→p☀]/g, ''));
              if (isNaN(val)) val = 0;

              overallTotal[column] = (overallTotal[column] || 0) + val;
              dayTotal[column] = (dayTotal[column] || 0) + val;

            }
          }

        } else {
          if (column === "options-column" || column === "options-popup-column") {
            if (useRefactor) {
              if (item[column] === undefined) throw new Error("item[column] is undefined");
              if (item["time-column"] === undefined) throw new Error("item['time - column'] is undefined");

              newRow.appendChild(this.getCellTransformationRefactor(item[column], column, hass.themes.darkMode, index, item["time-column"]));
            }
            else {
              console.warn("1 Issue?")
            }
          }
        }
      });

      newTableBody.appendChild(newRow);

      if (isMidnight) {

        for (let i = 0; i < 2; i++) {
          newTableBody.appendChild(this.createDividerRows(columnsToReturn.length, hass.themes.darkMode));
        }

        if (this.config === undefined) throw new Error("this.config not set");

        if (this.config.show_day_totals === true) {

          // Now insert a row for the day total
          let dayTotalsRow = document.createElement('tr');
          dayTotalsRow.classList.add('dayTotalRow');

          columnsToReturn.forEach((column, index) => {

            let totalCell = document.createElement('td');

            if (columnsWithTotals.includes(column) && column !== 'limit-column') {
              let returnTotal;

              if (dayTotal[column] === undefined) throw new Error("dayTotal undefined");

              if (column === "cost-column" || column === "total-column") {
                let formattedCost = "";

                if (dayTotal[column] < 0) {
                  formattedCost = `-£${(Math.abs(dayTotal[column]) / 100).toFixed(2)}`;
                  totalCell.style.color = "var(--success-color)";
                } else {
                  formattedCost = `£${(dayTotal[column] / 100).toFixed(2)}`;
                  totalCell.style.color = "var(--error-color)";
                }
                returnTotal = `<b>${formattedCost}</b>`;
              }
              else {
                returnTotal = `<b>${dayTotal[column].toFixed(2)}</b>`;
              }


              totalCell.innerHTML = returnTotal;
            }

            if (column === "time-column" && index === 0)
              totalCell.innerHTML = `<b>TOTALS</b>`;



            dayTotalsRow.appendChild(totalCell);

          });
          newTableBody.appendChild(dayTotalsRow);
          for (let i = 0; i < 2; i++) {
            newTableBody.appendChild(this.createDividerRows(columnsToReturn.length, hass.themes.darkMode));
          }
        }
      }
    });

    // Create total rows if in the config

    if (this.config.show_totals === true || this.config.show_plan_totals === true) {

      let totalsRow = document.createElement('tr');
      totalsRow.classList.add('totalRow');

      columnsToReturn.forEach((column, index) => {

        let totalCell = document.createElement('td');

        if (column === "time-column" && index === 0)
          totalCell.innerHTML = `<b>PLAN TOTALS</b>`;

        if (columnsWithTotals.includes(column) && column !== 'limit-column') {

          let returnTotal;
          if (overallTotal[column] === undefined) throw new Error("dayTotal undefined");

          if (column === "cost-column" || column === "total-column") {

            if (column === "total-column" && dayTotal[column])
              overallTotal[column] = overallTotal[column] + dayTotal[column];

            let formattedCost = "";

            if (overallTotal[column] < 0) {
              formattedCost = `-£${(Math.abs(overallTotal[column]) / 100).toFixed(2)}`;
            } else {
              formattedCost = `£${(overallTotal[column] / 100).toFixed(2)}`;
            }
            returnTotal = `<b>${formattedCost}</b>`;
          } else
            returnTotal = `<b>${overallTotal[column].toFixed(2)}</b>`;

          totalCell.innerHTML = returnTotal;
        }

        totalsRow.appendChild(totalCell);

      });

      newTableBody.appendChild(totalsRow);
    }

    let newHeaderRow = document.createElement('tr');
    newTableHead.classList.add('topHeader');

    //create the header rows
    columnsToReturn.forEach((column, index) => {
      let newColumn = document.createElement('th');
      newColumn.innerHTML = this.getColumnDescription(column);
      newHeaderRow.appendChild(newColumn);

    });

    newTableHead.appendChild(newHeaderRow);

    // This section of code is hiding any columns if they have no value (and the user has set them as a column to return)

    if (this.config.hide_empty_columns === true) {

      let indexesToRemove: number[] = [];
      columnsToReturn.forEach((column, index) => {
        if (columnsWithTotals.includes(column) && overallTotal[column] === 0)
          indexesToRemove.push(columnsToReturn.indexOf(column));
      });

      if (indexesToRemove.length > 0) {
        for (let row of newTableHead.rows) {
          // Hide the cell in the specified column
          indexesToRemove.forEach((columnIndex, index) => {
            if (row.cells[columnIndex]) {
              row.cells[columnIndex].style.display = "none";
            }
          });
        }
        for (let row of newTableBody.rows) {
          // Hide the cell in the specified column
          indexesToRemove.forEach((columnIndex, index) => {
            if (row.cells[columnIndex]) {
              row.cells[columnIndex].style.display = "none";
            }
          });
        }
      }
    }


    // If path_for_click config is added, show a pointer on hover over of table, and click to navigate to new view.
    if (this.config.path_for_click && this.config.path_for_click.length > 0) {
      theTable.style.cursor = 'pointer';
      theTable.addEventListener("click", () => {
        if (this.config === undefined) throw new Error("this.config not set");

        this.navigateToPath(this.config.path_for_click);  // Replace with your actual path
      });
    }

    theTable.appendChild(newTableHead);
    theTable.appendChild(newTableBody);

    if (this.content === null) throw new Error("this.content not set");

    this.content.innerHTML = "";         // Clear existing content

    if (this.config.hide_last_update !== true) {

      const lastUpdated = state ? state.last_updated : "Unavailable";
      const time = this.getLastUpdatedFromHTML(lastUpdated);

      if (time !== undefined) {
        let lastUpdateHeaderDiv = document.createElement('div');

        lastUpdateHeaderDiv.classList.add('lastUpdateRow');
        lastUpdateHeaderDiv.innerHTML = `<b>Plan Last Updated:</b> ${time}. Duration: ${this._lastOnText}`;

        if (hass.states[predbatActiveEntityId].state === "on") {
          lastUpdateHeaderDiv.innerHTML += `<ha-icon class="icon-spin" icon="mdi:loading" style="--mdc-icon-size: 18px; margin-left: 4px;" title="Generating next plan"></ha-icon>`;
        }

        this.content.appendChild(lastUpdateHeaderDiv);

      }
    }

    this.content.appendChild(theTable);  // Add actual DOM node (preserves listeners)


    if (this.config.show_predbat_version === true)
      this.content.appendChild(this.createVersionLabelsForFooter(`update.${prefix}_version`, "Predbat Version", this));

    if (this.config.show_tablecard_version === true)
      this.content.appendChild(this.createVersionLabelsForFooter("update.predbat_table_card_update", "Predbat Table Card Version", this));

    const styleTag = document.createElement('style');
    styleTag.innerHTML = this.getStyles(this.getLightMode(hass.themes.darkMode));
    this.content.appendChild(styleTag);
  }

  createVersionLabelsForFooter(entity: string, label: string, cardContext: this) {
    if (this._hass === undefined) throw new Error("_hass undefined");

    const version = this._hass.states[entity].attributes.installed_version;
    const latestVersion = this._hass.states[entity].attributes.latest_version;

    let lastUpdateHeaderDiv = document.createElement('div');

    lastUpdateHeaderDiv.classList.add('versionRow');

    let updateIcon = ``;
    let updateText = ``;
    if (version !== latestVersion) {
      updateIcon = `<ha-icon icon="mdi:download-circle-outline" style="color: var(--primary-color); --mdc-icon-size: 18px; margin-left: 4px;" title="Predbat Table Card version ${latestVersion} available"></ha-icon>`;
      updateText = `<span style="color: var(--primary-color);"><b>${latestVersion} available</b></span>`;
      lastUpdateHeaderDiv.style.cursor = "pointer";
      lastUpdateHeaderDiv.addEventListener('click', () => {
        const event = new CustomEvent('hass-more-info', {
          bubbles: true,
          composed: true,
          detail: { entityId: entity }
        });

        cardContext.dispatchEvent(event);
      });
    }

    lastUpdateHeaderDiv.innerHTML = `<b>${label}:</b> ${version}${updateIcon} ${updateText}`;

    return lastUpdateHeaderDiv;
  }

  navigateToPath(path: string) {
    window.history.pushState(null, "", path);
    const event = new CustomEvent("location-changed", {
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  createDividerRows(columnLength: number, darkMode: true) {

    let dividerRow = document.createElement('tr');
    dividerRow.classList.add('daySplitter');
    for (let j = 0; j < columnLength; j++) {
      let newCell = document.createElement('td');

      if (this.getLightMode(darkMode)) {
        newCell.style.backgroundColor = "#e1e1e1";
        newCell.style.opacity = "0.4";
      } else {
        // light mode
        newCell.style.backgroundColor = "var(--primary-color)";
        newCell.style.opacity = "1.00";
      }

      newCell.style.height = "1px";
      dividerRow.appendChild(newCell);
    }
    return dividerRow;

  }

  getLightMode(hassDarkMode: boolean) {
    let lightMode = "auto";
    let cssLightMode;

    //set the light mode if the YAML is present
    if (this.config === undefined) throw new Error("this.config is undefined");

    if (this.config.light_mode !== undefined)
      lightMode = this.config.light_mode;

    switch (lightMode) {
      case "dark":
        cssLightMode = true;
        break;
      case "light":
        cssLightMode = false;
        break;
      default:
        cssLightMode = hassDarkMode;
    }
    return cssLightMode;
  }


  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 3;
  }

  isVersionGreater(a: string, b: string) {
    const pa = a.replace(/^v/, '').split('.').map(Number);
    const pb = b.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return true;
      if (na < nb) return false;
    }
    return false; // equal
  }

  getTimeframeForOverride(timeString: string) {
    if (this.config === undefined) throw new Error("this.config not set");

    let prefix = getPrefix(this.config.entity);

    if (prefix === "sensor") prefix = "predbat";

    if (this._hass === undefined) throw new Error("this._hass not set");

    const predBatVersion = this._hass.states[`update.${prefix}_version`].attributes.installed_version;

    // Match either "Wed 08:05" or "08:05"
    const match = timeString.match(/^(?:(\w{3})\s)?(\d{2}):(\d{2})$/);
    if (match === null || !match) return null;

    const day = match[1] || null;

    if (match[2] === undefined) throw new Error("match[2] undefined");

    let hours = parseInt(match[2], 10);

    if (match[3] === undefined) throw new Error("match[3] undefined");

    let minutes = parseInt(match[3], 10);

    // Floor to the nearest half hour
    minutes = minutes >= 30 ? 30 : 0;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");

    // New format if version > v8.28.2 and a day is present
    if (this.isVersionGreater(predBatVersion, "v8.28.1"))
      return `${day} ${hh}:${mm}`;

    // Old format
    return `${hh}:${mm}:00`;
  }

  getArrayForEntityForceStates(entity: HassEntity) {

    let entityState = entity.state;
    return entityState.replace(/^\+/, '').split(',');
  }

  createButtonForOverrides(entityObject: EntityObject, timeForSelectOverride: string, iconSize: number, textColor: string, hideLabel: boolean, isAllowed: boolean, fromPopup = false) {

    if (this.config === undefined) throw new Error("this.config not set");

    let prefix = getPrefix(this.config.entity);

    if (prefix === "sensor")
      prefix = "predbat";
    const key = entityObject.entityName.replace(`select.${prefix}_manual_`, '');

    const iconOpacityOff = "0.5";
    const iconOpacityOn = "1.00";
    const iconColorOff = "rgb(75, 80, 87)";
    const iconColorOn = "rgb(58, 238, 133)";
    const snowIconColorOn = "#000000";
    const snowIconColorOff = "#FFFFFF";

    if (this._hass === undefined) throw new Error("_hass undefined");

    const settings = this.getArrayForEntityForceStates(this._hass.states[entityObject.entityName])
      .map((s) => s.trim())
      .filter(Boolean);
    const isActive = key === 'soc'
      ? settings.some((entry) => entry.startsWith(`${timeForSelectOverride}=`))
      : settings.includes("" + timeForSelectOverride);

    const iconColor = isAllowed ? (isActive ? iconColorOn : iconColorOff) : iconColorOff;
    const iconOpacity = isAllowed ? (isActive ? iconOpacityOn : iconOpacityOff) : '0.25';
    const iconCursor = isAllowed ? 'pointer' : 'not-allowed';

    const snowIconColor = isActive ? snowIconColorOn : snowIconColorOff;
    const snowOpacity = isAllowed ? '0.9' : '0.25';

    let snowflakeIcon: HaIcon | null = null;

    // Main container: vertical layout
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.width = iconSize + "px";
    //container.style.margin = '0 4px';

    // Icon wrapper for potential overlay
    const iconWrapper = document.createElement('div');
    iconWrapper.style.position = 'relative';
    iconWrapper.style.width = iconSize + "px";
    iconWrapper.style.height = iconSize + "px";

    // Main icon
    const iconEl = document.createElement('ha-icon');
    iconEl.setAttribute('title', entityObject.entityTitle);
    iconEl.setAttribute('icon', entityObject.entityIcon);
    iconEl.style.cursor = iconCursor;
    iconEl.style.opacity = iconOpacity;
    iconEl.style.color = iconColor;
    iconEl.style.setProperty('--mdc-icon-size', iconSize + "px");
    iconEl.style.width = iconSize + "px";
    iconEl.style.height = iconSize + "px";

    if (isAllowed) {

      // if soc override then setup different click
      if (key === "soc") {
        iconEl.addEventListener('click', () => {
          if (this._hass === undefined) throw new Error("_hass undefined");

          const currentSettings = this.getArrayForEntityForceStates(this._hass.states[entityObject.entityName])
            .map((s) => s.trim())
            .filter(Boolean);
          const isSocActive = currentSettings.some((entry) => entry.startsWith(`${timeForSelectOverride}=`));

          if (isSocActive) {
            const remaining = currentSettings.filter((entry) => !entry.startsWith(`${timeForSelectOverride}=`));

            this._hass.callService('select', 'select_option', {
              entity_id: entityObject.entityName,
              option: 'off'
            });

            for (const entry of remaining) {
              this._hass.callService('select', 'select_option', {
                entity_id: entityObject.entityName,
                option: entry
              });
            }

            iconEl.style.opacity = iconOpacityOff;
            iconEl.style.color = iconColorOff;
            if (snowflakeIcon) snowflakeIcon.style.color = snowIconColorOff;
          } else {
            if (fromPopup) {
              const openCloseButton = document.querySelector('#custom-modal-overlay #modal-close-btn');
              if (openCloseButton instanceof HTMLElement) {
                openCloseButton.click();
              } else {
                const openOverlay = document.getElementById('custom-modal-overlay');
                if (openOverlay) openOverlay.remove();
              }
            }
            // open up soc pop up
            this.createPopUpForSoCOverride(entityObject, timeForSelectOverride);
          }
        });

      } else {

        // Click handler ONLY if allowed
        iconEl.addEventListener('click', () => {
          if (this._hass === undefined) throw new Error("_hass undefined");

          const currentSettings = this.getArrayForEntityForceStates(this._hass.states[entityObject.entityName]);
          const isActive = currentSettings.includes("" + timeForSelectOverride);

          if (fromPopup) {
            const parent = container.parentElement;
            if (parent) {
              const allButtons = parent.querySelectorAll('[data-force-key]');
              allButtons.forEach((btn) => {
                if (!(btn instanceof HTMLElement)) throw new Error("btn is not HTMLElement");

                const keyAttr = btn.dataset.forceKey;
                if (keyAttr === key) return;

                const icon = btn.querySelector('ha-icon');
                if (icon instanceof HTMLElement) {
                  icon.style.opacity = iconOpacityOff;
                  icon.style.color = iconColorOff;
                }
                else {
                  throw new Error("icon is not HTMLElement");
                }

                const snowflake = btn.querySelector('ha-icon[icon="mdi:snowflake"]');
                if (snowflake instanceof HTMLElement) {
                  snowflake.style.color = snowIconColorOff;
                }
                else {
                  throw new Error("snowflake is not HTMLElement");
                }
              });
            }
          }
          if (isAllowed) {
            if (isActive) {

              iconEl.style.opacity = iconOpacityOff;
              iconEl.style.color = iconColorOff;
              if (snowflakeIcon) snowflakeIcon.style.color = snowIconColorOff;

              const updatedSettings = currentSettings.filter(t => t !== "" + timeForSelectOverride);

              this._hass.callService('select', 'select_option', {
                entity_id: entityObject.entityName,
                option: 'off'
              });

              for (const time of updatedSettings) {
                this._hass.callService('select', 'select_option', {
                  entity_id: entityObject.entityName,
                  option: time
                });
              }
            } else {
              iconEl.style.opacity = iconOpacityOn;
              iconEl.style.color = iconColorOn;
              if (snowflakeIcon) snowflakeIcon.style.color = snowIconColorOn;

              this._hass.callService('select', 'select_option', {
                entity_id: entityObject.entityName,
                option: timeForSelectOverride
              });
            }
          }
        });
      }

    }

    iconWrapper.appendChild(iconEl);

    // Overlay snowflake if applicable
    if (key === 'freeze_charge' || key === 'freeze_export') {

      snowflakeIcon = document.createElement('ha-icon');
      snowflakeIcon.setAttribute('icon', 'mdi:snowflake');
      snowflakeIcon.setAttribute('title', entityObject.entityTitle);
      snowflakeIcon.style.setProperty('--mdc-icon-size', iconSize / 3 + 'px');
      snowflakeIcon.style.color = snowIconColor;
      snowflakeIcon.style.position = 'absolute';
      snowflakeIcon.style.top = (iconSize / 3) - 10 + 'px';
      snowflakeIcon.style.left = iconSize / 3 + 'px';
      snowflakeIcon.style.opacity = snowOpacity;
      snowflakeIcon.style.cursor = 'pointer';
      snowflakeIcon.style.pointerEvents = 'none';

      iconWrapper.appendChild(snowflakeIcon);
    }

    // Label
    const label = document.createElement('div');
    label.textContent = key.replace(/_/g, ' ');
    label.style.fontSize = '8px';
    label.style.textTransform = 'uppercase';
    label.style.color = textColor;
    label.style.textAlign = 'center';
    label.style.marginTop = '2px';
    label.style.whiteSpace = 'normal';      // Allow wrapping
    label.style.wordBreak = 'break-word';   // Break long words if needed
    label.style.width = '100%';             // Take full width of parent

    // Assemble
    container.appendChild(iconWrapper);
    if (!hideLabel)
      container.appendChild(label);

    container.dataset.forceKey = key;
    return container;
  }

  getOverrideEntities() {

    // 100✎ →
    if (this.config === undefined) throw new Error("this.config not set");

    let prefix = getPrefix(this.config.entity);

    if (prefix === "sensor")
      prefix = "predbat";

    if (this._hass === undefined) throw new Error("_hass undefined");

    const versionEntity = this._hass.states?.[`update.${prefix}_version`];
    const installedVersionRaw = versionEntity?.attributes?.installed_version || '';
    const installedVersion = installedVersionRaw.startsWith('v')
      ? installedVersionRaw
      : (installedVersionRaw ? `v${installedVersionRaw}` : '');
    const allowManualSoc = installedVersion &&
      (installedVersion === "v8.29.7" || this.isVersionGreater(installedVersion, "v8.29.7"));

    const forceEntityArray = [
      `select.${prefix}_manual_demand`,
      `select.${prefix}_manual_charge`,
      `select.${prefix}_manual_export`,
      `select.${prefix}_manual_freeze_charge`,
      `select.${prefix}_manual_freeze_export`
    ];

    if (allowManualSoc) {
      forceEntityArray.push(`select.${prefix}_manual_soc`);
    }

    const titleMap: Record<string, string> = {
      demand: "Force Manual Demand",
      charge: "Force Manual Charge",
      export: "Force Manual Export",
      freeze_export: "Force Freeze Export",
      freeze_charge: "Force Freeze Charge",
      soc: "Force SoC"
    };

    const iconMap: Record<string, string> = {
      demand: "mdi:home-battery",
      charge: "mdi:battery-plus",
      export: "mdi:battery-minus",
      freeze_export: "mdi:battery-minus",
      freeze_charge: "mdi:battery-plus",
      soc: "mdi:battery-charging-high"
    };

    const forceEntityObjects = forceEntityArray.map(entityName => {
      const key = entityName.replace(`select.${prefix}_manual_`, '');  // e.g., "freeze_export"
      return {
        entityName,
        entityIcon: iconMap[key] || 'mdi:help-circle',
        entityTitle: titleMap[key] || key
      };
    });

    return forceEntityObjects;
  }

  openModal(overlayId: string, buildModalBox: (closeModal: () => void) => HTMLElement | null, overlayStyles = {}, modalStyles = {}) {
    if (document.getElementById(overlayId)) return null;

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 200ms ease-in-out',
    }, overlayStyles);
    overlay.id = overlayId;

    let escHandler: ((e: KeyboardEvent) => void) | null = null;
    const closeModal = () => {
      overlay.remove();
      if (escHandler) document.removeEventListener('keydown', escHandler);
    };

    const modalBox = buildModalBox(closeModal);
    if (!modalBox) return null;

    Object.assign(modalBox.style, {
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px 40px 20px 40px',
      borderRadius: '8px',
      border: '2px solid var(--text-primary-color)',
      boxShadow: '0 2px 10px rgba(0,0,0,1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }, modalStyles);

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', escHandler);

    void overlay.offsetWidth;
    overlay.style.opacity = '1';

    return { overlay, closeModal };
  }

  createPopUpForSoCOverride(entityObject: EntityObject, timeForSelectOverride: string) {
    if (this.config === undefined) throw new Error("this.config not set");

    let prefix = getPrefix(this.config.entity);

    if (prefix === "sensor")
      prefix = "predbat";
    const inputEntity = `input_number.${prefix}_manual_soc_value`;

    if (this._hass === undefined) throw new Error("_hass undefined");

    const entityState = this._hass.states?.[inputEntity];
    const defaultSocValue = entityState?.state ?? '';

    this.openModal('custom-modal-overlay-soc', (closeModal) => {
      const modalBox = document.createElement('div');
      modalBox.style.width = '200px';

      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.alignItems = 'center';
      headerRow.style.paddingBottom = '20px';

      const titleBox = document.createElement('div');
      titleBox.style.color = 'var(--text-primary-color)';
      titleBox.innerHTML = "Target SoC for " + timeForSelectOverride;
      titleBox.style.width = '100%';
      titleBox.style.display = 'flex';
      titleBox.style.justifyContent = 'center';
      titleBox.style.alignItems = 'center';
      titleBox.style.flex = '1';
      titleBox.style.fontSize = '16px';
      titleBox.style.fontWeight = 'bold';
      titleBox.style.textShadow = '1px 1px 1px black';

      const closeBox = document.createElement('div');
      closeBox.style.position = 'absolute';
      closeBox.style.top = '5px';
      closeBox.style.right = '5px';

      const closeButton = document.createElement('ha-icon');
      closeButton.setAttribute('title', "SoC Override");
      closeButton.setAttribute('icon', "mdi:close-circle-outline");
      closeButton.style.cursor = 'pointer';
      closeButton.style.margin = '0 2px';
      closeButton.style.color = "var(--text-primary-color)";
      closeButton.style.setProperty('--mdc-icon-size', '40px');
      closeButton.id = 'modal-close-btn';
      closeButton.addEventListener('click', closeModal);

      closeBox.appendChild(closeButton);
      headerRow.appendChild(titleBox);
      modalBox.appendChild(closeBox);
      modalBox.appendChild(headerRow);

      const inputWrapper = document.createElement('div');
      inputWrapper.style.display = 'flex';
      inputWrapper.style.flexDirection = 'column';
      inputWrapper.style.gap = '6px';
      inputWrapper.style.marginBottom = '16px';
      const inputId = 'predbat-soc-target-input';

      const inputElement = document.createElement('input');
      inputElement.type = 'number';
      inputElement.min = '0';
      inputElement.max = '100';
      inputElement.step = '1';
      inputElement.name = 'predbat_soc_target';
      inputElement.value = defaultSocValue;
      inputElement.id = inputId;
      inputElement.style.padding = '8px';
      inputElement.style.borderRadius = '4px';
      inputElement.style.border = '1px solid var(--text-primary-color)';
      inputElement.style.background = 'rgba(255, 255, 255, 0.1)';
      inputElement.style.color = 'var(--text-primary-color)';

      inputWrapper.appendChild(inputElement);
      modalBox.appendChild(inputWrapper);

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Override';
      saveButton.style.padding = '10px 16px';
      saveButton.style.borderRadius = '6px';
      saveButton.style.border = '1px solid var(--text-primary-color)';
      saveButton.style.background = 'var(--text-primary-color)';
      saveButton.style.color = 'var(--primary-background-color)';
      saveButton.style.fontWeight = 'bold';
      saveButton.style.cursor = 'pointer';
      saveButton.style.alignSelf = 'center';
      saveButton.style.marginBottom = '10px';
      saveButton.addEventListener('click', () => {
        const newValue = parseFloat(inputElement.value);
        if (Number.isNaN(newValue)) return;
        const formattedValue = newValue.toFixed(1);

        if (this._hass === undefined) throw new Error("_hass undefined");

        this._hass.callService('input_number', 'set_value', {
          entity_id: inputEntity,
          value: formattedValue,
        });

        const existingState = this._hass.states?.[entityObject.entityName]?.state || '';
        const existingEntries = existingState
          .replace(/^\+/, '')
          .split(',')
          .map((entry: string) => entry.trim())
          .filter(Boolean);

        const timeSlot = timeForSelectOverride;
        const newEntry = `${timeSlot}=${formattedValue}`;
        const updatedEntries = existingEntries.filter((entry: string) => !entry.startsWith(`${timeSlot}=`));
        updatedEntries.push(newEntry);

        this._hass.callService('select', 'select_option', {
          entity_id: entityObject.entityName,
          option: 'off',
        });

        for (const entry of updatedEntries) {
          this._hass.callService('select', 'select_option', {
            entity_id: entityObject.entityName,
            option: entry,
          });
        }

        closeModal();
      });
      modalBox.appendChild(saveButton);

      return modalBox;
    });
  }

  createPopUpForOverrides(timeForSelectOverride: string, timestamp: { value: string; }, isAllowed: boolean) {

    const forceEntityObjects = this.getOverrideEntities();

    this.openModal('custom-modal-overlay', (closeModal) => {
      const modalBox = document.createElement('div');

      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.alignItems = 'center';
      headerRow.style.paddingBottom = '20px';

      const titleBox = document.createElement('div');
      titleBox.style.color = 'var(--text-primary-color)';
      titleBox.innerHTML = timestamp.value;
      titleBox.style.width = '100%';
      titleBox.style.display = 'flex';
      titleBox.style.justifyContent = 'center';
      titleBox.style.alignItems = 'center';
      titleBox.style.flex = '1';
      titleBox.style.fontSize = '16px';
      titleBox.style.fontWeight = 'bold';
      titleBox.style.textShadow = '1px 1px 1px black';

      const closeBox = document.createElement('div');
      closeBox.style.position = 'absolute';
      closeBox.style.top = '5px';
      closeBox.style.right = '5px';

      const closeButton = document.createElement('ha-icon');
      closeButton.setAttribute('title', "Battery Overrides");
      closeButton.setAttribute('icon', "mdi:close-circle-outline");
      closeButton.style.cursor = 'pointer';
      closeButton.style.margin = '0 2px';
      closeButton.style.color = "var(--text-primary-color)";
      closeButton.style.setProperty('--mdc-icon-size', '40px');
      closeButton.id = 'modal-close-btn';
      closeButton.addEventListener('click', closeModal);

      closeBox.appendChild(closeButton);

      headerRow.appendChild(titleBox);

      modalBox.appendChild(closeBox);
      modalBox.appendChild(headerRow);

      const buttonBox = document.createElement('div');
      buttonBox.style.display = 'flex';
      buttonBox.style.justifyContent = 'space-between';
      buttonBox.style.alignItems = 'flex-start';

      if (isAllowed) {
        for (const forceEntity of forceEntityObjects) {
          const icon = this.createButtonForOverrides(forceEntity, timeForSelectOverride, 40, 'var(--text-primary-color)', false, isAllowed, true);
          buttonBox.appendChild(icon);
        }
      } else {
        buttonBox.style.textAlign = "center";
        buttonBox.style.color = "#FFFFFF";
        buttonBox.innerHTML = "This slot cannot currently be overridden. <br>Overrides will be available as the day progresses.";
      }

      modalBox.appendChild(buttonBox);
      return modalBox;
    });
  }

  checkRowIsAllowedForOverride(forceEntityObjects: EntityObject[], timeForSelectOverride: string | null, itemIndex: number) {
    let isAllowed = false;
    for (const forceEntity of forceEntityObjects) {
      if (this._hass === undefined) throw new Error("_hass undefined");

      const allowedOptions = this._hass.states[forceEntity.entityName].attributes.options;
      if (itemIndex <= allowedOptions.length - 2)
        isAllowed = allowedOptions.includes(timeForSelectOverride);
      if (isAllowed)
        break;
    }
    return isAllowed;
  }

  replaceArrowsWithIcons(theItem: string) {
    const val = theItem;

    // Find the first arrow (↘ ↗ →). Adjust the regex if you want a different priority.
    const m = val.match(/[↘↗→]/);

    const iconName = m ? ({
      '↘': 'mdi:arrow-down-thin',
      '↗': 'mdi:arrow-up-thin',
      '→': 'mdi:arrow-right-thin'
    }[m[0]]) : null;

    const theArrowIcon = iconName
      ? `<ha-icon icon="${iconName}" style="margin:0 -2px;"></ha-icon>`
      : '';

    const rawValue = val.replace(/[↘↗→]/g, '');
    return [rawValue, theArrowIcon];
  }

  getFriendlyNamesForState(state: string) {
    let friendlyText = state;

    friendlyText = friendlyText.replace('Force Dischrg', 'Discharge');
    friendlyText = friendlyText.replace('Force Charge', 'Charge');
    //friendlyText = friendlyText.replace('Exp🐌', 'Export');


    if (friendlyText.includes("ⅎ")) {
      friendlyText = friendlyText.replace('Exp', 'Export');
      friendlyText = friendlyText.replace('Chrg', 'Charge');
      friendlyText = "Manually Forced " + friendlyText;
      if (!friendlyText.includes("Charge") && !friendlyText.includes("Discharge") && !friendlyText.includes("Export"))
        friendlyText = friendlyText + "Demand";
      friendlyText = friendlyText.replace('ⅎ', '');
    } else {
      if (/^[↘↗→]$/.test(state)) {
        friendlyText = friendlyText.replace('↘', 'Discharging');
        friendlyText = friendlyText.replace('↗', 'Charging');
        friendlyText = friendlyText.replace('→', 'Idle');
      }
      friendlyText = friendlyText.replace('FrzDis', 'Charging Paused');
      friendlyText = friendlyText.replace('FrzExp', 'Charging Paused');
      friendlyText = friendlyText.replace('FrzChrg', 'Maintaining SoC'); //FreezeChrg
      friendlyText = friendlyText.replace('HoldChrg', 'Maintain SoC at Limit'); //HoldChrg
      friendlyText = friendlyText.includes("NoCharge") ? friendlyText.replace('NoCharge', 'Charge to Limit') : friendlyText.replace('Charge', 'Planned Charge');
      friendlyText = friendlyText.replace('Discharge', 'Planned Export'); //Discharge
      friendlyText = friendlyText.replace(/Export|Exp/g, 'Planned Export'); // Exp or Export
      friendlyText = friendlyText.replace('Alert Charge', 'Planned Charge ⚠'); // Alert Charge
      friendlyText = friendlyText.replace(/Charge|Chrg/g, 'Planned Charge'); // Chrg or Charge
    }
    friendlyText = friendlyText.replace(/[↘↗→]/g, '');
    return friendlyText;
  }

  getCellsForSplitCell(theItem: { value: string; }, newCell: HTMLDivElement) {

    newCell.style.minWidth = "186px";
    if (this.config === undefined) throw new Error("this.config not set");

    if (this.config.use_friendly_states === true)
      newCell.style.minWidth = "276px";
    newCell.style.paddingLeft = "0px";
    newCell.style.paddingRight = "0px";

    let chargeString = "Charge";
    if (theItem.value === "Both-Chg" || theItem.value === "Both-Dis" || theItem.value === "Both-Idle" || theItem.value === "Both-Dis-Snail")
      chargeString = "";

    let dischargeString = "Export";

    if (this.isSmallScreen() && (this.config.use_friendly_states === false || this.config.use_friendly_states === undefined)) {

      if (theItem.value === "Both") {
        chargeString = "Chg";
        dischargeString = "Exp";
      }

      if (theItem.value === "Both-Chg" || theItem.value === "Both-Dis" || theItem.value === "Both-Idle" || theItem.value === "Both-Dis-Snail") {
        dischargeString = "Exp";
      }

      newCell.style.minWidth = "110px";
    }

    if (this.config.use_friendly_states === true && this.isSmallScreen() === false) {
      if (theItem.value === "Both")
        chargeString = "Planned Charge";
      else if (theItem.value === "Both-Chg")
        chargeString = "Charging";
      else if (theItem.value === "Both-Dis")
        chargeString = "Discharging";

      dischargeString = "Planned Export";
    } else if (this.config.use_friendly_states === true && this.isSmallScreen() === true) {
      if (theItem.value === "Both")
        chargeString = "Plnd Chg";
      else if (theItem.value === "Both-Chg")
        chargeString = "Chg";
      else if (theItem.value === "Both-Dis" || theItem.value === "Both-Dis-Snail")
        chargeString = "Dis";

      dischargeString = "Plnd Dis";
      newCell.style.minWidth = "110px";
    }

    let chargeBackgroundColor = "background-color:#3AEE85;";
    let chargeTextColor = "color: #000000;";
    if (theItem.value === "Both-Idle" || theItem.value === "Both-Dis" || theItem.value === "Both-Chg" || theItem.value === "Both-Dis-Snail") {
      chargeBackgroundColor = "background-color:transparent;";
      chargeTextColor = "color: var(--primary-text-color)";
    }
    let chargeIcon;
    if (theItem.value === "Both" || theItem.value === "Both-Chg")
      chargeIcon = '<ha-icon icon="mdi:arrow-up-thin" style="margin: 0 0 0 -5px"></ha-icon>';
    else if (theItem.value === "Both-Idle")
      chargeIcon = '<ha-icon icon="mdi:arrow-right-thin" style="margin: 0 0 0 -3px"></ha-icon>';
    else if (theItem.value === "Both-Dis" || theItem.value === "Both-Dis-Snail")
      chargeIcon = '<ha-icon icon="mdi:arrow-down-thin" style="margin: 0 0 0 -5px"></ha-icon>';

    let snail = ``;
    if (theItem.value === "Both-Dis-Snail")
      snail = `<ha-icon icon="mdi:snail" title="Low Power Mode" style="--mdc-icon-size: 14px;"></ha-icon>`;

    return `<div style="width: 100%; height: 100%;" id="${theItem.value}">
            <div style='${chargeBackgroundColor} width: 50%; height: 100%; float: left; display: flex; align-items: center; justify-content: center; ${chargeTextColor}'>${chargeString}${chargeIcon}</div>
            <div style='background-color:#FFFF00; width: 50%; height: 100%; float: left; display: flex; align-items: center; justify-content: center; color: #000000;'>${dischargeString}<ha-icon icon="mdi:arrow-down-thin" style="margin: 0 0 0 -5px"></ha-icon>${snail}</div>
            </div>`;
  }

  getCellTransformationRefactor(theItem: CellValue, column: ColumnKey, darkMode: boolean, itemIndex: number, timestamp: { value: any; }) {

    let newCell = document.createElement('td');
    let newContent = (typeof theItem?.value === 'string') ? theItem.value.trim() : theItem?.value ?? '';
    if (this.config === undefined) throw new Error("this.config not set");
    let prefix = getPrefix(this.config.entity);
    if (prefix === "sensor")
      prefix = "predbat";

    let debugValue, rawValue;

    if (theItem)
      rawValue = theItem.value;

    let hasBoldTags = false, hasItalicTags = false;
    const wrap = (text: string, tag: string) => `<${tag}>${text}</${tag}>`;

    const timeForSelectOverride = this.getTimeframeForOverride(timestamp.value);
    const forceEntityObjects = this.getOverrideEntities();
    const isAllowed = this.checkRowIsAllowedForOverride(forceEntityObjects, timeForSelectOverride, itemIndex);

    const nonDataColumns: ColumnKey[] = ['options-column', 'options-popup-column'];
    const isNonDataColumn = nonDataColumns.includes(column);

    const columnsWithCustomTransformation = ['time-column', 'import-column', 'export-column', 'limit-column', 'soc-column',
      'weather-column', 'rain-column', 'temp-column', 'state-column', 'cost-column', 'options-column', 'options-popup-column',
      'pv-column', 'import-export-column', 'car-column'];

    const bothValues = ["Both", "Both-Idle", "Both-Chg", "Both-Dis", "Both-Dis-Snail"];
    const isBothField = bothValues.includes(theItem?.value);

    // This var will be used to collect the different parts of the response and build at the end.
    let cellResponseArray = [];

    // Old Skool Configuration

    let useOldSkool = false;
    if ((this.config.old_skool || this.config.old_skool_columns?.includes(column)) && !isNonDataColumn) {
      if (!isBothField) {
        if (theItem.color === null) throw new Error("theItem.color is null");

        newCell.style.backgroundColor = theItem.color;
      }
      if (theItem.color)
        newCell.style.color = "#000000";
      useOldSkool = true;
    } else if (!isNonDataColumn) {
      if (theItem.color)
        newCell.style.color = theItem.color
    }

    if ((isNonDataColumn && this.config.old_skool) || (this.config.old_skool && column === 'import-export-column')) {
      newCell.style.backgroundColor = "#FFFFFF";
      useOldSkool = true;
      newCell.style.color = "#000000";
    }

    // clean string formatting from predbat to get raw value
    // Organise Debug things...

    let hasDebug = false;
    const useDebug = (this.config.debug_columns !== undefined && this.config.debug_columns.indexOf(column) > -1);
    let pricesStringFromRaw: string | null = null;

    if (!isNonDataColumn && typeof theItem.value === 'string') {

      rawValue = theItem.value.replace(/[↘↗→☀ ]/g, '').trim();
      rawValue = rawValue.replace(/<b>(.*?)<\/b>/g, '$1');
      rawValue = rawValue.replace(/<i>(.*?)<\/i>/g, '$1');
      hasBoldTags = /<b>.*?<\/b>/.test(theItem.value);
      hasItalicTags = /<i>.*?<\/i>/.test(theItem.value);

      pricesStringFromRaw = rawValue;

      //debug
      hasDebug = (theItem.value.includes("(") && theItem.value.includes(")"));
      if (hasDebug) {

        const match = rawValue.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
        if (match) {
          rawValue = match?.[1] ?? rawValue;
          debugValue = match[2];
        }

        if (match === null) {
          console.log("Raw: ", rawValue);
          console.log("match: ", match);
        }
      }
    }


    // Column Specific Configuration
    // These are the custom column treatments, must be included in the array first, then specifically called out in the IF statement

    if (columnsWithCustomTransformation.includes(column)) {

      // Time Column time-column

      if (column === "time-column") {

        if (this.config.force_single_line)
          newCell.style.whiteSpace = "nowrap";

        newCell.style.width = "70px";

        // make time column tap/clickable for override pop up

        const columnsToReturn = this.config.columns;
        const hasNonData = nonDataColumns.some(col => columnsToReturn.includes(col));

        if (column === "time-column" && !hasNonData) {
          newCell.style.cursor = 'pointer';
          for (const forceEntity of this.getOverrideEntities()) {
            if (this._hass === undefined) throw new Error("_hass undefined");

            const settings = this.getArrayForEntityForceStates(this._hass.states[forceEntity.entityName]);
            const timeframeForOverride = this.getTimeframeForOverride(timestamp.value);
            const isActive = timeframeForOverride !== null && settings.includes(timeframeForOverride);
            if (isActive && isAllowed) {
              newCell.style.color = "rgb(58, 238, 133)";
              break;
            }
          }
          newCell.addEventListener('click', () => {
            const timeframeForOverride = this.getTimeframeForOverride(timestamp.value);
            if (timeframeForOverride === null) throw new Error("timeframeForOverride is null");
            this.createPopUpForOverrides(timeframeForOverride, timestamp, isAllowed);
          });
        }

        cellResponseArray.push(theItem.value);

      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Car Column

      if (column === "car-column") {
        //newCell.style.color = "var(--primary-text-color)";
        let additionalIcon = "";

        if (this.config.car_charge_switch) {
          if (this._hass === undefined) throw new Error("_hass undefined");
          const entity = this._hass.states[this.config.car_charge_switch];
          if (entity && entity.state === 'on' && itemIndex === 0) {
            additionalIcon = '<ha-icon class="pulse-icon" icon="mdi:ev-plug-type2" style="--mdc-icon-size: 16px; margin-top: -2px; margin-left: 2px;"></ha-icon>';
          }
        }

        cellResponseArray.push(`<div class="iconContainer">${theItem.value}${additionalIcon}</div>`);

      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Options Columns

      if (column === "options-popup-column" || column === "options-column") {
        if (timeForSelectOverride === null) throw new Error("timeForSelectOverride is null");

        if (column === "options-popup-column") {

          const iconSize = 24;
          const iconOpacity = isAllowed ? '0.8' : '0.25';
          const iconPointer = isAllowed ? 'pointer' : 'not-allowed';

          // CREATE THE ICON
          const iconEl = document.createElement('ha-icon');
          iconEl.setAttribute('title', "Battery Overrides");
          iconEl.setAttribute('icon', "mdi:application-edit-outline");
          iconEl.style.cursor = iconPointer;
          iconEl.style.opacity = iconOpacity;
          iconEl.style.fill = "var(--text-primary-color)";
          iconEl.style.setProperty('--mdc-icon-size', iconSize + 'px');

          for (const forceEntity of forceEntityObjects) {
            if (this._hass === undefined) throw new Error("_hass undefined");

            const settings = this.getArrayForEntityForceStates(this._hass.states[forceEntity.entityName])
              .map((s) => s.trim())
              .filter(Boolean);
            const key = forceEntity.entityName.replace(`select.${prefix}_manual_`, '');

            const isActive = key === 'soc'
              ? settings.some((entry) => entry.startsWith(`${timeForSelectOverride}=`))
              : settings.includes(timeForSelectOverride);
            if (isActive && isAllowed) {
              iconEl.style.color = "rgb(58, 238, 133)";
              iconEl.style.opacity = "1.0";
              break;
            }
          }

          // Add click handler
          iconEl.addEventListener('click', () => {
            const timeframeForOverride = this.getTimeframeForOverride(timestamp.value);

            if (timeframeForOverride === null) throw new Error("timeframeForOverride is null");

            this.createPopUpForOverrides(timeframeForOverride, timestamp, isAllowed);
          });

          newCell.style.height = (iconSize + 10) + 'px';
          newCell.appendChild(iconEl);
        }

        if (column === "options-column") {

          const headerRow = document.createElement('div');
          headerRow.style.display = 'flex';
          headerRow.style.justifyContent = 'space-between';
          headerRow.style.alignItems = 'flex-start';

          for (const forceEntity of forceEntityObjects) {
            // Create Icon
            const icon = this.createButtonForOverrides(forceEntity, timeForSelectOverride, 24, 'var(--primary-text-color)', true, isAllowed, true);
            // Append to DOM
            icon.style.width = '34px';
            headerRow.appendChild(icon);
          }

          newCell.style.width = '170px';
          newCell.appendChild(headerRow);

        }

      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Import Export Column

      if (column === "import-export-column") {
        if (Array.isArray(theItem) === false) throw new Error("theItem is not an array");

        let newPills = "";
        let newPillsNoContainer = "";
        theItem.forEach((item: { color: string; }, index: any) => {

          let contentWithoutTags = pricesStringFromRaw;
          let priceStrings;

          if (this.config === undefined) throw new Error("this.config not set");

          if (this.config.debug_prices_only === true) {
            // force debug price pill only
            if (contentWithoutTags === null) throw new Error("contentWithoutTags is null");

            priceStrings = this.getPricesFromPriceString(contentWithoutTags, hasBoldTags, hasItalicTags, true);
            newPills += '<div style="height: 26px; align-items: center;">' + this.getTransformedCostToPill({ "value": priceStrings[1], "color": item.color }, darkMode) + '</div>';
            newPillsNoContainer += this.getTransformedCostToPill({ "value": priceStrings[1], "color": item.color }, darkMode);

          } else {

            let numberOfPrices = theItem.length;


            newPills += '<div style="height: 26px; align-items: center;">' + this.getTransformedCostToPill(item, darkMode) + '</div>';
            newPillsNoContainer += this.getTransformedCostToPill(item, darkMode);
          }

        });

        if (this.config.stack_pills === false) {
          cellResponseArray.push('<div class="iconContainer">' + newPillsNoContainer + '</div>');
        } else {
          cellResponseArray.push('<div class="multiPillContainer">' + newPills + '</div>');
        }
      }


      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Import Column import-column

      if (column === "import-column" || column === "export-column") {

        // If oldSkool do something different
        if (useOldSkool) {
          if (hasDebug && useDebug)
            cellResponseArray.push(theItem.value);
          else {
            if (hasBoldTags) rawValue = wrap(rawValue, 'b');
            if (hasItalicTags) rawValue = wrap(rawValue, 'i');
            cellResponseArray.push(rawValue);
          }

        } else {
          // manage debug price pills appropriately
          // debug_prices_only | true | false

          let contentWithoutTags = pricesStringFromRaw;

          if (hasDebug && useDebug) {
            // if debug prices are present based on ( ) search
            // AND YAML config has debug_columns
            // AND YAML config has specific column for debug_columns
            // THEN SHOW THE DEBUG

            let newPills = "";

            // TEST
            //contentWithoutTags = "-1.23? ⚖ (-3.45)";

            let priceStrings;
            if (contentWithoutTags === null) throw new Error("contentWithoutTags is null");

            if (theItem.color === null) throw new Error("theItem.color is null");

            if (this.config.debug_prices_only === true) {
              // force debug price pill only
              priceStrings = this.getPricesFromPriceString(contentWithoutTags, hasBoldTags, hasItalicTags, true);
              cellResponseArray.push('<div class="iconContainer">' + this.getTransformedCostToPill({ "value": priceStrings[1], "color": theItem.color }, darkMode) + '</div>');

            } else {
              priceStrings = this.getPricesFromPriceString(contentWithoutTags, hasBoldTags, hasItalicTags, false);

              if (this.config.stack_pills === false) {
                cellResponseArray.push('<div class="iconContainer">' + this.getTransformedCostToPill({ "value": priceStrings[0], "color": theItem.color }, darkMode)
                  + this.getTransformedCostToPill({ "value": priceStrings[1], "color": theItem.color }, darkMode)
                  + '</div>');
              } else {
                newPills += '<div style="height: 26px; align-items: center;">' + this.getTransformedCostToPill({ "value": priceStrings[0], "color": theItem.color }, darkMode) + '</div>';
                newPills += '<div style="height: 26px; align-items: center;">' + this.getTransformedCostToPill({ "value": priceStrings[1], "color": theItem.color }, darkMode) + '</div>';
                cellResponseArray.push('<div class="multiPillContainer">' + newPills + '</div>');
              }
            }

          } else if (hasDebug) {

            // TEST
            //contentWithoutTags = "-1.23? ⚖ (-3.45)";
            if (contentWithoutTags === null) throw new Error("contentWithoutTags is null");
            if (theItem.color === null) throw new Error("theItem.color is null");

            let priceStrings = this.getPricesFromPriceString(contentWithoutTags, hasBoldTags, hasItalicTags, this.config.debug_prices_only);
            cellResponseArray.push('<div class="iconContainer">' + this.getTransformedCostToPill({ "value": priceStrings[0], "color": theItem.color }, darkMode) + '</div>');

          } else {
            if (theItem.color === null) throw new Error("theItem.color is null");
            cellResponseArray.push('<div class="iconContainer">' + this.getTransformedCostToPill(theItem, darkMode) + '</div>');
          }

        }

      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Cost Column

      if (column === "cost-column") {
        cellResponseArray = this.replaceArrowsWithIcons(theItem.value);
        const temp = cellResponseArray[0];

        if (temp !== undefined) {
          cellResponseArray[0] = temp.replace(' ', '');
        }
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // State Column

      if (column === "state-column") {

        let stateText;

        if (useOldSkool) {

          if (isBothField) {

            cellResponseArray.push(this.getCellsForSplitCell(theItem, newCell));

          } else {

            stateText = theItem.value.replace(/[↘↗→ⅎ🐌⚠]/g, '').trim();
            stateText = this.adjustStatusFields(stateText);
            if (this.config.use_friendly_states)
              stateText = this.getFriendlyNamesForState(theItem.value);

            cellResponseArray = this.replaceArrowsWithIcons(theItem.value);
            cellResponseArray[0] = stateText;
          }
        } else {

          let snail = ``;
          if (theItem.value.includes("🐌")) {
            snail = `<ha-icon icon="mdi:snail" title="Low Power Mode" style="--mdc-icon-size: 18px;"></ha-icon>`;
          }

          stateText = theItem.value.replace(/[↘↗→ⅎ🐌⚠]/g, '').trim();

          let weatherAlert = ``;
          if (theItem.value.includes("⚠"))
            weatherAlert = `<ha-icon icon="mdi:alert-outline" title="Weather Alert" style="--mdc-icon-size: 18px;"></ha-icon>`;

          stateText = this.adjustStatusFields(stateText);

          let additionalArrow = "";
          newCell.setAttribute('style', 'color: var(--energy-battery-out-color)');

          if (theItem.value === "↘" || theItem.value === "↗" || theItem.value === "→") {
            let tooltip = "Running Normally";
            additionalArrow = `<ha-icon icon="mdi:home-lightning-bolt" title="${tooltip}" style="--mdc-icon-size: 22px;"></ha-icon>`;

            newCell.setAttribute('style', `color: ${theItem.color}`);
          } else if (theItem.value === "↘ ⅎ" || theItem.value === "↗ ⅎ" || theItem.value === "→ ⅎ") {
            let tooltip = "Running Normally";
            additionalArrow = `<ha-icon icon="mdi:home-lightning-bolt" title="${tooltip}" style="--mdc-icon-size: 22px;"></ha-icon>`;
            newCell.setAttribute('style', `color: ${theItem.color}`);
          } else if (stateText === "Discharge" || stateText === "Export") {

            // use force discharge icon
            let tooltip = "Planned Export";
            additionalArrow = `<ha-icon icon="mdi:battery-minus" style="" title="${tooltip}" class="icons" style="--mdc-icon-size: 22px;"></ha-icon>`;

          } else if (stateText === "FreezeDis" || stateText === "FreezeChrg" || stateText === "HoldChrg" || stateText === "NoCharge" || stateText === "FreezeExp") {
            // use force discharge icon
            additionalArrow = '<ha-icon icon="mdi:battery-lock" style="" title="Charging Paused"></ha-icon>';
            newCell.setAttribute('style', `color: ${theItem.color}`);
          } else if (stateText === "Charge" || stateText === "Alert Charge") {
            let tooltip = "Planned Charge";
            additionalArrow = `<ha-icon icon="mdi:battery-charging-100" title="${tooltip}" style="--mdc-icon-size: 22px;"></ha-icon>`;

            newCell.setAttribute('style', 'color: var(--energy-battery-in-color)');
          }

          let directionalArrow = this.replaceArrowsWithIcons(theItem.value);
          cellResponseArray.push(`${weatherAlert}${additionalArrow}${directionalArrow[1]}${snail}`);

          if (isBothField) {

            const arrowsToReturn = ["↗", "↘"];
            let arrowArray = [];
            for (const arrow of arrowsToReturn) {
              const iconString = this.replaceArrowsWithIcons(arrow)[1];

              if (iconString === undefined) throw new Error("iconString is undefined");

              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = iconString;

              const iconElement = tempDiv.firstElementChild; // the <ha-icon> element

              if (!(iconElement instanceof HTMLElement)) {
                throw new Error("iconElement is not an HTMLElement");
              }

              if (arrow === "↗")
                iconElement.style.color = 'var(--energy-battery-in-color)';
              if (arrow === "↘")
                iconElement.style.color = 'var(--energy-battery-out-color)';

              iconElement.style.margin = '0 -4px';

              arrowArray.push(iconElement);
            }

            if (stateText === "Both") {
              cellResponseArray.length = 0;

              if (arrowArray[0] === undefined) throw new Error("arrowArray[0] is undefined");
              if (arrowArray[1] === undefined) throw new Error("arrowArray[1] is undefined");

              cellResponseArray.push('<ha-icon icon="mdi:battery-charging-100" style="color: var(--energy-battery-in-color); --mdc-icon-size: 22px;" title="Planned Charge" class="icons"></ha-icon>');
              cellResponseArray.push(arrowArray[0].outerHTML);
              cellResponseArray.push('<ha-icon icon="mdi:battery-minus" style="color: var(--energy-battery-out-color);" title="Planned Export" class="icons"></ha-icon>');
              cellResponseArray.push(arrowArray[1].outerHTML);
            } else if (stateText === "Both-Idle" || stateText === "Both-Chg" || stateText === "Both-Dis" || stateText === "Both-Dis-Snail") {
              let houseColor = "#000000";
              if (this.getLightMode(darkMode))
                houseColor = "#FFFFFF";

              cellResponseArray.length = 0;
              cellResponseArray.push(`<ha-icon icon="mdi:home-lightning-bolt" style="color: ${houseColor}" title="Idle" style="--mdc-icon-size: 22px;"></ha-icon>`);

              if (arrowArray[1] === undefined) throw new Error("arrowArray[1] is undefined");

              let arrowColourOverride = arrowArray[1].cloneNode(true);

              if (!(arrowColourOverride instanceof HTMLElement)) {
                throw new Error("arrowColourOverride is not an HTMLElement");
              }

              arrowColourOverride.style.color = houseColor;
              cellResponseArray.push(arrowColourOverride.outerHTML);
              cellResponseArray.push(`<ha-icon icon="mdi:battery-minus" style="color: var(--energy-battery-out-color);" title="Planned Export" class="icons"></ha-icon>`);
              cellResponseArray.push(arrowArray[1].outerHTML);
              if (stateText === "Both-Dis-Snail")
                cellResponseArray.push(`<ha-icon icon="mdi:snail" title="Low Power Mode" style="--mdc-icon-size: 18px;"></ha-icon>`);
            }

          }
        }
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // PV Column pv-column

      if (column === 'pv-column') {
        //newCell.style.backgroundColor = theItem.color;

        if ((theItem.value.includes("☀") || theItem.value.length > 0) && !theItem.value.includes("⚊")) {

          if (hasDebug && useDebug)
            newContent = rawValue + " (" + debugValue + ")";
          else
            newContent = rawValue;


          let additionalIcon = "";
          if (!this.isSmallScreen())
            additionalIcon = '<ha-icon icon="mdi:white-balance-sunny" style="margin: 0; --mdc-icon-size: 16px; display: flex; align-items: center; justify-content: center;"></ha-icon>';

          cellResponseArray.push(`<div class="iconContainer">${additionalIcon} <div style="margin: 0 4px;">${newContent}</div></div>`);
        }
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Limit Column limit-column

      if (column === "limit-column" && !useOldSkool) {

        if (theItem.value.replace(/\s/g, '').length > 0) {

          let debugSVG = ``;
          let debugString = theItem.value;
          if (hasDebug) {

            if (useDebug) {
              if (rawValue != debugValue) {
                debugSVG = `<svg version="1.1" width="26" height="26" id="limitSVG">
                                    <circle cx="13" cy="13" r="11" stroke="#2a3240" stroke-width="1" stroke-dasharray="5,3" fill="#e1e1e1"/>
                                    <text class="pill" x="13" y="14" dominant-baseline="middle" text-anchor="middle" fill="#2a3240" font-size="10">${debugValue}</text>
                                    </svg>`;
              }
            }
            debugString = rawValue;
          }

          const mainSVG = `<svg version="1.1" width="26" height="26" id="limitSVG">
                            <circle cx="13" cy="13" r="11" stroke="#2a3240" stroke-width="2" fill="#e1e1e1"/>
                            <text class="pill" x="13" y="14" dominant-baseline="middle" text-anchor="middle" fill="#2a3240" font-size="10" font-weight="bold">${debugString}</text>
                            </svg>`;

          cellResponseArray.push(`<div class="iconContainer">${mainSVG} ${debugSVG}</div>`);

        }
      } else if (column === "limit-column" && useOldSkool) {
        cellResponseArray.push(theItem.value);
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // SOC Column soc-column

      if (column === "soc-column") {

        let arrowForLabel = this.replaceArrowsWithIcons(theItem.value);

        const batteryPercentLabel = rawValue;
        const parsedPercent = parseFloat(String(rawValue ?? '').replace(/[^\d.]+/g, ''));
        const batteryPercentValue = Number.isNaN(parsedPercent) ? null : parsedPercent;
        const isManualEdit = (batteryPercentLabel ?? '').toString().includes('✎');
        const batteryLabelClean = (batteryPercentLabel ?? '').toString().replace(/✎/g, '');
        let batteryArrow = "";

        if (theItem.value.includes("↘")) {
          // include a down arrow
          newCell.style.paddingRight = "0px";
          batteryArrow = '<ha-icon icon="mdi:arrow-down-thin" style="--mdc-icon-size: 16px; margin: 0 -5px 0 -5px;"></ha-icon>';
        } else if (theItem.value.includes("↗")) {
          // include a down arrow
          newCell.style.paddingRight = "0px";
          batteryArrow = '<ha-icon icon="mdi:arrow-up-thin" style="--mdc-icon-size: 16px; margin: 0 -5px 0 -5px;"></ha-icon>';
        } else {
          batteryArrow = '<ha-icon icon="mdi:arrow-right-thin" style="--mdc-icon-size: 16px; margin: 0 -5px 0 -5px;"></ha-icon>';
        }

        let battery;
        const needsPercentSuffix = batteryLabelClean.includes('%') ? '' : '%';
        const batteryTitle = `${batteryLabelClean}${needsPercentSuffix}`;
        let columnContent = `${batteryLabelClean}${needsPercentSuffix}`;

        //calculate % in kWh if battery_capacity is present
        // could be 54✎%
        if (this.config.battery_capacity && !isNaN(parseFloat(this.config.battery_capacity)) && batteryPercentValue !== null) {

          let capacity = parseFloat(this.config.battery_capacity);
          let actualCapacity = ((batteryPercentValue / 100) * capacity).toFixed(2);
          columnContent = actualCapacity;
        }

        const roundedPercent = Math.round((batteryPercentValue ?? 0) / 10) * 10;
        let batteryIcon;
        if (roundedPercent === 100) {
          batteryIcon = "battery";
        }
        else if (roundedPercent < 5) {
          batteryIcon = `battery-outline`;
        } else {
          batteryIcon = `battery-${roundedPercent}`;
        }

        battery = `<ha-icon icon="mdi:${batteryIcon}" style="--mdc-icon-size: 20px;" title="${batteryTitle}"></ha-icon>${batteryArrow}`;

        newCell.style.paddingLeft = "4px";
        newCell.style.minWidth = "70px";
        newCell.style.alignItems = "center";

        const manualEditIcon = isManualEdit
          ? '<ha-icon icon="mdi:hand-back-right-outline" style="--mdc-icon-size: 14px; margin-left: 4px;"></ha-icon>'
          : '';

        if (useOldSkool)
          cellResponseArray.push(`<div title="${batteryTitle}">${columnContent}${arrowForLabel[1]}${manualEditIcon}</div>`);
        else
          cellResponseArray.push(`<div style="width: 70px; align-items: center; display: flex; justify-content: center; margin: 0 auto;"><div class="iconContainerSOC" title="${batteryTitle}">${battery}</div><div style="margin-left: 5px; margin-top: 2px; display:flex; align-items:center;">${columnContent}${manualEditIcon}</div></div>`);

      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Setting appropriate cell color for weather columns

      if (column === "weather-column" || column === "temp-column" || column === "rain-column") {
        if (theItem.color == "#FFFFFF")
          newCell.style.color = "var(--primary-text-color)";
        else
          newCell.style.color = theItem.color;

        if (darkMode && useOldSkool)
          newCell.style.color = "#000000";
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Weather Column weather-column

      if (column === "weather-column") {

        if (theItem.value !== undefined && theItem.value !== null) {

          let condition = theItem.value.condition;
          if (condition === "partlycloudynight")
            condition = "partlycloudy";

          if (this._hass === undefined) throw new Error("_hass undefined");

          if (this.config.weather_entity === undefined) throw new Error("this.config.weather_entity is undefined");

          const weatherEntity = this._hass.states[this.config.weather_entity];
          const readableCondition =
            this._hass.formatEntityState?.(weatherEntity, condition) ||
            this._hass.localize?.(`component.weather.entity_component._.state.${condition}`) ||
            condition;

          let weatherIcon: WeatherIcon = this.convertConditionToIcon(theItem.value.condition);
          //const readableCondition = this._hass.localize(`component.weather.state._.${theItem.value.condition}`);

          const tempUnit = weatherEntity?.attributes?.temperature_unit || this._hass.config.unit_system.temperature;

          cellResponseArray.push(`<div class="iconContainer"><ha-icon icon="mdi:${weatherIcon}" title="${readableCondition}, ${theItem.value.temperature}${tempUnit}"></ha-icon></div>`);
        }
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Temperature Column temp-column

      if (column === "temp-column") {

        if (theItem.value !== undefined && theItem.value !== null) {

          const temp = parseFloat(theItem.value.temperature);

          if (this._hass === undefined) throw new Error("_hass undefined");
          if (this.config.weather_entity === undefined) throw new Error("this.config.weather_entity is undefined");

          const weatherEntity = this._hass.states[this.config.weather_entity];
          const tempUnit = weatherEntity?.attributes?.temperature_unit || this._hass.config.unit_system.temperature;

          cellResponseArray.push(`<div class="iconContainer">${temp.toFixed(1)}<div class="tempUnit">${tempUnit}</div></div>`);
        }
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Rain Column rain-column

      if (column === "rain-column") {

        if (theItem.value !== undefined && theItem.value !== null) {

          const rainChance = Math.round(parseFloat(theItem.value.precipitation_probability));
          cellResponseArray.push(`<div class="iconContainer">${rainChance}%</div>`);
        }
      }

    }

    // finally replace any empty cell or "⚊" with iconography

    if (typeof theItem?.value === 'string' && (this.config.fill_empty_cells ?? true) && (newContent.length === 0 || newContent === "⚊") && !isNonDataColumn) {

      let minusColor = "var(--primary-text-color)";
      if (theItem.color && useOldSkool)
        minusColor = "black";

      newContent = "";

      cellResponseArray.length = 0;
      cellResponseArray.push(`<div class="iconContainer"><ha-icon icon="mdi:minus" style="color: ${minusColor}; margin: 0 2px; opacity: 0.25;"></ha-icon></div>`);
    }

    // For all other cells that dont need custom transform
    if (!columnsWithCustomTransformation.includes(column) && cellResponseArray.length === 0) {

      if (hasDebug && useDebug)
        newContent = rawValue + " (" + debugValue + ")";
      else
        newContent = rawValue;

      if (newContent !== undefined && newContent.length > 0)
        cellResponseArray.push(newContent);
    }

    //

    if (!isNonDataColumn && typeof theItem.value === 'string')
      if (theItem.value.includes("ⅎ"))
        cellResponseArray.push(` <ha-icon icon="mdi:hand-back-right-outline" title="OVERRIDE" style="--mdc-icon-size: 18px;"></ha-icon>`);

    for (const object of cellResponseArray) {
      newCell.innerHTML += object;
    }

    return newCell;

  }

  convertConditionToIcon(condition: WeatherCondition): WeatherIcon {
    switch (condition) {
      case "partlycloudy":
        return "weather-partly-cloudy";
      case "partlycloudynight":
        return "weather-night-partly-cloudy";
      case "clear-night":
        return "weather-night";
      case "sunny":
        return "weather-sunny";
      case "cloudy":
        return "weather-cloudy";
      case "exceptional":
        return "alert-outline";
      case "fog":
        return "weather-fog";
      case "hail":
        return "weather-hail";
      case "lightning":
        return "weather-lightning";
      case "lightning-rainy":
        return "weather-lightning-rainy";
      case "pouring":
        return "weather-pouring";
      case "snowy":
        return "weather-snowy";
      case "snowy-rainy":
        return "weather-snowy-rainy";
      case "windy":
        return "weather-windy";
      case "windy-variant":
        return "weather-windy-variant";
      case "rainy":
        return "weather-pouring";
      default:
        return "cloud-question";
    }
  }

  adjustStatusFields(status: string) {
    let newState = status;

    if (status === "FrzChrg")
      newState = "FreezeChrg";
    if (status === "HoldChrg")
      newState = "HoldChrg";
    if (status === "NoChrg")
      newState = "NoCharge";
    if (status === "Chrg")
      newState = "Charge";
    if (status === "FrzDis")
      newState = "FreezeDis";
    if (status === "FrzExp")
      newState = "FreezeExp";
    if (status === "Exp")
      newState = "Export";
    if (status === "Dis")
      newState = "Discharge";
    if (status === "Dis ⅎ")
      newState = "Force Dischrg"
    if (status === "Chrg ⅎ")
      newState = "Force Charge"
    if (status === "⚠Chrg")
      newState = "Alert Charge"
    return newState;
  }

  adjustTotalCostField(cost: string) {
    if (cost.includes("-")) {
      cost = cost.replace("-", "");
      cost = "-" + cost;
    }
    return cost;
  }

  getPricesFromPriceString(thePriceString: string, hasBoldTags: boolean, hasItalicTags: boolean, debugOnly: boolean) {

    //            ? ⅆ - Rate that has been modified based on input_number.predbat_metric_future_rate_offset_import or input_number.predbat_metric_future_rate_offset_export
    //            ? ⚖ - Rate that has been estimated using future rate estimation data (e.g. Nordpool)
    //            = - Rate that has been overridden by the users apps.yaml
    //            ± - Rate that has been adjusted with a rate offset in the users apps.yaml
    //            $ - Rate that has been adjusted for an Octopus Saving session
    //            ? - Rate that has not yet been defined and the previous days data was used instead

    // thePriceString = "-1.23? ⚖ (-3.45)";

    const testRegex = /(\d+\.\d+)\D+(\d+\.\d+)/;
    const testMatches = thePriceString.match(testRegex);

    if (testMatches === null) throw new Error("testMatches is null");
    if (testMatches[1] === undefined) throw new Error("testMatches[1] is undefined");
    if (testMatches[2] === undefined) throw new Error("testMatches[2] is undefined");

    const strippedString = thePriceString.replace(/-/g, '').replace(testMatches[1], '').replace(testMatches[2], '').replace(/[()]/g, '').trim();

    let firstPillString = "";
    let secondPillString = "";

    //adding back the negative values
    if (thePriceString.includes("-")) {
      if ((thePriceString.match(/-/g) || []).length == 2) {
        firstPillString = "-";
        secondPillString = "-";
      } else {
        if (thePriceString.startsWith("-")) {
          firstPillString = "-";
          secondPillString = "";
        } else {
          firstPillString = "";
          secondPillString = "-";
        }
      }
    }

    if (debugOnly) {
      firstPillString += testMatches[1];
      secondPillString += testMatches[2] + strippedString;
    } else {
      firstPillString += testMatches[1] + strippedString;
      secondPillString += testMatches[2];
    }

    let firstPart = firstPillString;
    let secondPart = `(${secondPillString}) `;

    if (hasBoldTags) {
      firstPart = `<b>${firstPillString}</b>`;
      secondPart = `<b>(${secondPillString})</b>`;
    }

    if (hasItalicTags) {
      firstPart = `<i>${firstPillString}</i>`;
      secondPart = `<i>(${secondPillString})</i>`;
    }

    if (hasItalicTags && hasBoldTags) {
      firstPart = `<b><i>${firstPillString}</i></b>`;
      secondPart = `<b><i>(${secondPillString})</i></b>`;
    }

    return [firstPart, secondPart];
  }

  getTransformedCostToPill(theItem: { value?: any; color: string; forEach?: any; length?: any }, darkMode: boolean) {
    if (theItem.value === undefined) throw new Error("theItem.value is undefined");

    const hasBoldTags = /<b>.*?<\/b>/.test(theItem.value);
    const hasItalicTags = /<i>.*?<\/i>/.test(theItem.value);

    let contentWithoutTags;
    let boldAttribute = "";
    let italicAttribute = "";
    let boldLozenge = "";
    let strokeWidth = 1;

    let borderLozengeColor;
    if (this.getLightMode(darkMode) === true)
      borderLozengeColor = this.getDarkenHexColor(theItem.color, 60);
    else
      borderLozengeColor = this.getDarkenHexColor(theItem.color, 60);

    if (hasBoldTags || hasItalicTags) {
      contentWithoutTags = theItem.value.replace(/<b>(.*?)<\/b>/g, '$1');
      contentWithoutTags = contentWithoutTags.replace(/<i>(.*?)<\/i>/g, '$1');

      if (hasBoldTags) {
        boldAttribute = ' font-weight="bold"';
        strokeWidth = 2;
        boldLozenge = ' stroke="' + borderLozengeColor + '" stroke-width="' + strokeWidth + '"';
      }

      if (hasItalicTags) {
        italicAttribute = ' font-style="italic"';
        strokeWidth = 1;
        boldLozenge = ' stroke="' + borderLozengeColor + '" stroke-width="' + strokeWidth + '"';
      }

      if (hasItalicTags && hasBoldTags) {
        strokeWidth = 2;
        boldLozenge = ' stroke="' + borderLozengeColor + '" stroke-width="' + strokeWidth + '"';
      }

    } else {
      strokeWidth = 1;
      contentWithoutTags = theItem.value;
      boldLozenge = ' stroke="' + borderLozengeColor + '" stroke-width="' + strokeWidth + '"';
    }

    // Measure the width of the text in pixels

    let textWidth = contentWithoutTags.length * 8.5;// Adjust the factor based on your font and size
    if (textWidth < 70) {
      textWidth = 70;
    }

    let textColor;
    let pillColor = theItem.color;
    if (this.getLightMode(darkMode) === true) {
      // card is dark mode
      textColor = this.getDarkenHexColor(theItem.color, 60);
    } else {
      // card is light mode
      textColor = this.getDarkenHexColor(theItem.color, 70);
      pillColor = this.getVibrantColor(theItem.color, 15);
      pillColor = this.getLightenHexColor(pillColor, 10);
    }

    let svgLozenge = `<svg version="1.1" width=${textWidth} height="24" style="margin-top: 0px;">
                                <rect x="4" y="2" width="${textWidth - 10}" height="20" fill="${pillColor}"${boldLozenge} ry="10" rx="10"/>
                                <text class="pill" x="48%" y="13" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-size="11"${boldAttribute}${italicAttribute}>${contentWithoutTags}</text>
                            </svg>`;

    return svgLozenge;
  }

  getMetadataFromHTML(html: string) {

    const dummyElement = document.createElement('div');
    dummyElement.innerHTML = html;
    const trElements = dummyElement.querySelectorAll('tbody tr');

    let metaArray: string[] = [];
    trElements.forEach((trElement, index) => {

      const numberOfChildren = trElement.children.length;

      //detect if row data is metadata (rows with no table data). If children <td> is less than 2
      if (numberOfChildren < 2) {
        const tdElements = trElement.querySelectorAll('td');
        tdElements.forEach(tdElement => {
          metaArray.splice(index, 0, tdElement.innerHTML);
        });

      }

    });

    return metaArray;

  }

  getLastUpdatedFromHTML(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if same year, month, day
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Format time in 24-hour format
    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Build final string
    const timeStr = isToday
      ? `Today at ${time}`
      : `${date.toLocaleDateString('en-GB')} at ${time}`;

    return timeStr;
  }


  isSmallScreen() {
    const screenWidth = window.innerWidth;
    if (screenWidth < 815) {
      return true;
    } else {
      return false;
    }
  }

  isLabelDuringNight(label: string, hass: Hass) {
    const sun = hass.states['sun.sun'];
    if (!sun) return false;

    const sunrise = new Date(sun.attributes.next_rising);
    const sunset = new Date(sun.attributes.next_setting);

    // Extract only the time parts (local time)
    const sunriseHour = sunrise.getHours();
    const sunriseMinute = sunrise.getMinutes();
    const sunsetHour = sunset.getHours();
    const sunsetMinute = sunset.getMinutes();

    // Parse label
    const [labelDayStr, labelTimeStr] = label.split(' ');

    if (labelTimeStr === undefined) throw new Error("labelTimeStr is undefined");

    const [labelHour, labelMinute] = labelTimeStr.split(':').map(Number);

    if (labelHour === undefined) throw new Error("labelHour is undefined");
    if (labelMinute === undefined) throw new Error("labelMinute is undefined");

    // Compare to assumed sunrise/sunset time
    const labelMinutes = labelHour * 60 + labelMinute;
    const sunriseMinutes = sunriseHour * 60 + sunriseMinute;
    const sunsetMinutes = sunsetHour * 60 + sunsetMinute;

    return labelMinutes < sunriseMinutes || labelMinutes >= sunsetMinutes;
  }

  findForecastForLabel(label: string, forecastArray: Forecast[]) {
    if (!label || !forecastArray?.length || !this._hass || !this.config?.weather_entity) {
      return null;
    }

    const [labelDayStr, labelTimeStr] = label.split(' ');

    if (labelTimeStr === undefined) throw new Error("labelTimeStr is undefined");

    const [labelHour, _labelMinute] = labelTimeStr.split(':').map(Number);

    if (labelDayStr === undefined) throw new Error("labelDayStr is undefined");

    if (invalidDay(labelDayStr)) throw new Error("Invalid weekday");

    const targetWeekday = weekdayMap[labelDayStr as WeekdayKey];
    const now = new Date();
    const todayWeekday = now.getDay();
    const dayOffset = (targetWeekday - todayWeekday + 7) % 7;

    // Create label Date (local time), but round down to the hour
    const labelDate = new Date(now);
    labelDate.setDate(now.getDate() + dayOffset);

    if (labelHour === undefined) throw new Error("labelHour is undefined");

    labelDate.setHours(labelHour, 0, 0, 0); // zero minutes/seconds

    const labelHourTime = labelDate.getTime();

    // Try to find forecast that exactly matches this hour (local time)
    for (const forecast of forecastArray) {
      const forecastDate = new Date(forecast.datetime); // UTC -> local
      if (forecastDate.getTime() === labelHourTime) {
        return {
          ...forecast,
          source: 'forecast'
        };
      }
    }

    // If label time is in the past, return the closest future forecast or current weather
    if (labelHourTime < now.getTime()) {
      const futureForecasts = forecastArray
        .map(f => ({ ...f, time: new Date(f.datetime).getTime() }))
        .filter(f => f.time >= now.getTime())
        .sort((a, b) => a.time - b.time);

      if (futureForecasts.length) {
        return {
          ...futureForecasts[0],
          source: 'fallback-forecast'
        };
      }

      // Fallback to current weather if no future forecast is found
      const weatherEntity = this._hass.states[this.config.weather_entity];
      if (weatherEntity) {
        return {
          temperature: weatherEntity.attributes.temperature,
          condition: weatherEntity.state,
          precipitation_probability: weatherEntity.attributes.precipitation_probability,
          source: 'current-weather'
        };
      }
    }

    return null;
  }


  previous_findForecastForLabel(label: string, forecastArray: Forecast[]) {
    if (!label || !forecastArray?.length || !this._hass || !this.config?.weather_entity) {
      return null;
    }

    const [labelDayStr, labelTimeStr] = label.split(' ');
    if (labelTimeStr === undefined) throw new Error("labelTimeStr is undefined");
    const [labelHour, _labelMinute] = labelTimeStr.split(':').map(Number);

    if (labelDayStr === undefined) throw new Error("labelDayStr is undefined");
    if (!["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(labelDayStr)) {
      throw new Error("Invalid weekday");
    }

    const targetWeekday = weekdayMap[labelDayStr as WeekdayKey];
    const now = new Date();
    const todayWeekday = now.getDay();
    const dayOffset = (targetWeekday - todayWeekday + 7) % 7;

    // Create label Date (local time), but round down to the hour
    const labelDate = new Date(now);
    labelDate.setDate(now.getDate() + dayOffset);
    if (labelHour === undefined) throw new Error("labelHour is undefined");
    labelDate.setHours(labelHour, 0, 0, 0); // <-- zero minutes/seconds

    const labelHourTime = labelDate.getTime();

    // Try to find forecast that exactly matches this hour (local time)
    for (const forecast of forecastArray) {
      const forecastDate = new Date(forecast.datetime); // UTC -> local
      if (forecastDate.getTime() === labelHourTime) {
        return {
          ...forecast,
          source: 'forecast'
        };
      }
    }

    // Optional fallback to current conditions if this hour isn't in forecast
    const isCurrentHour =
      now.getFullYear() === labelDate.getFullYear() &&
      now.getMonth() === labelDate.getMonth() &&
      now.getDate() === labelDate.getDate() &&
      now.getHours() === labelDate.getHours();

    if (isCurrentHour) {
      const entity = this._hass.states[this.config.weather_entity];
      if (entity) {
        return {
          source: 'current',
          datetime: new Date().toISOString(),
          condition: entity.state,
          temperature: entity.attributes.temperature,
          humidity: entity.attributes.humidity,
          precipitation_probability: entity.attributes.precipitation_probability
        };
      }
    }

    return null;
  }


  getColumnDescription(column: ColumnKey) {
    const headerClassesObject = {
      'time-column': { description: "Time", smallDescription: "<ha-icon icon='mdi:calendar-clock' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'import-column': { description: "Import", smallDescription: "<ha-icon icon='mdi:transmission-tower-import' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'export-column': { description: "Export", smallDescription: "<ha-icon icon='mdi:transmission-tower-export' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'state-column': { description: "State", smallDescription: "State" },
      'limit-column': { description: "Limit", smallDescription: "<ha-icon icon='mdi:alert-circle-outline' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'pv-column': { description: "PV kWh", smallDescription: "<ha-icon icon='mdi:solar-panel' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'load-column': { description: "Load kWh", smallDescription: "<ha-icon icon='mdi:home-lightning-bolt' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'soc-column': { description: "SoC", smallDescription: "<ha-icon icon='mdi:battery-80' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'clip-column': { description: "Clip kWh", smallDescription: "Clip <br>kWh" },
      'car-column': { description: "Car kWh", smallDescription: "<ha-icon icon='mdi:car-electric' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'iboost-column': { description: "iBoost kWh", smallDescription: "<ha-icon icon='mdi:water-boiler' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'co2kg-column': { description: "CO2 kg", smallDescription: "CO2 kg" },
      'co2kwh-column': { description: "CO2 g/kWh", smallDescription: "CO2 g/kWh" },
      'cost-column': { description: "Cost", smallDescription: "<ha-icon icon='mdi:currency-gbp' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'total-column': { description: "Total Cost", smallDescription: "<ha-icon icon='mdi:currency-gbp' style='--mdc-icon-size: 18px;'></ha-icon><ha-icon icon='mdi:currency-gbp' style='--mdc-icon-size: 18px;'></ha-icon>" },
      'xload-column': { description: "XLoad kWh", smallDescription: "XLoad kWh" },
      'import-export-column': { description: "Import / Export", smallDescription: "<ha-icon icon='mdi:transmission-tower-import' style='--mdc-icon-size: 18px;'></ha-icon><ha-icon icon='mdi:transmission-tower-export' style='--mdc-icon-size: 18px;'></ha-icon>" },
      'net-power-column': { description: "Net kWh", smallDescription: "Net <br>kWh" },
      'weather-column': { description: "Weather", smallDescription: "<ha-icon icon='mdi:weather-partly-cloudy' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'rain-column': { description: "Rain Chance", smallDescription: "<ha-icon icon='mdi:weather-pouring' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'temp-column': { description: "Temp", smallDescription: "<ha-icon icon='mdi:thermometer' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'options-column': { description: "Override", smallDescription: "<ha-icon icon='mdi:button-pointer' style='--mdc-icon-size: 20px;'></ha-icon>" },
      'options-popup-column': { description: "Override", smallDescription: "<ha-icon icon='mdi:button-pointer' style='--mdc-icon-size: 20px;'></ha-icon>" }
    };

    if (headerClassesObject.hasOwnProperty(column)) {
      // Return the description associated with the key

      if (this.isSmallScreen()) {
        return headerClassesObject[column].smallDescription;
      } else {
        return headerClassesObject[column].description;
      }

    } else {
      // If the key does not exist, return a default description or handle the error as needed
      return "Description not found";
    }
  }

  convertTimeStampToFriendly(timestamp: string) {

    const date = new Date(timestamp.replace(/(\+\d{2})(\d{2})$/, "$1:$2")); // auto fix timezone colon

    const formatter = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const formatted = formatter.format(date).replace(",", "");
    return formatted;
  }

  getArrayDataFromRaw(raw: RawData, hassDarkMode: boolean) {

    let rowsToReturn = [];

    for (const row of raw.rows) {
      let rowDictionary = {} as RowData;
      let color = "#FFFFFF";

      // change the color, logic from
      // https://github.com/springfall2008/batpred/blob/dc18d2d9ffaae8b7b2fa4addf7f40bdec1da4890/apps/predbat/output.py#L1141

      let pvColor = color;
      if (row.pv_forecast !== null && row.pv_forecast >= 0.2)
        pvColor = "#FFAAAA";
      else if (row.pv_forecast !== null && row.pv_forecast >= 0.1)
        pvColor = "#FFFF00";

      let socColor = "#3AEE85";
      if (row.soc_percent < 20.0)
        socColor = "#F18261";
      else if (row.soc_percent < 50.0)
        socColor = "#FFFF00";

      let loadColor = color;
      if (row.load_forecast >= 0.5)
        loadColor = "#F18261";
      else if (row.load_forecast >= 0.25)
        loadColor = "#FFFF00";
      else if (row.load_forecast > 0.0)
        loadColor = "#AAFFAA";

      let stateColor = color;
      if (row.state === "FrzChrg")
        stateColor = "#EEEEEE";
      if (row.state === "HoldChrg")
        stateColor = "#34DBEB";
      if (row.state === "Chrg")
        stateColor = "#3AEE85";
      if (row.state === "FrzExp")
        stateColor = "#AAAAAA";
      if (row.state === "Exp")
        stateColor = "#FFFF00";


      const arrowGroups = {
        "→": ["Demand", "FrzExp"],
        "↗": ["Chrg"],
        "↘": ["Exp"],
      };

      const stateArrow =
        Object.entries(arrowGroups).find(([, states]) =>
          states.includes(row.state)
        )?.[0] || "";

      const costArrow =
        row.cost_change > 0 ? "↗" :
          row.cost_change < 0 ? "↘" :
            "→";

      const socArrow =
        row.soc_change > 0 ? "↗" :
          row.soc_change < 0 ? "↘" :
            "→";

      let trueCost = row.cost_change + " p " + costArrow;
      if (row.cost_change === 0)
        trueCost = "";

      if (row.pv_forecast === 0)
        row.pv_forecast = null;


      //{"value": "Both", "color": "green"};

      rowDictionary["time-column"] = { "value": this.convertTimeStampToFriendly(row.time), "color": color };
      rowDictionary["import-column"] = { "value": String(row.import_rate.toFixed(2)), "color": color };
      rowDictionary["export-column"] = { "value": String(row.export_rate.toFixed(2)), "color": color };
      rowDictionary["state-column"] = { "value": String(row.state) + socArrow, "color": stateColor };
      rowDictionary["limit-column"] = { "value": String(row.state_target), "color": color };
      rowDictionary["pv-column"] = { "value": String(row.pv_forecast) + "☀", "color": pvColor };
      rowDictionary["load-column"] = { "value": String(row.load_forecast), "color": loadColor };
      rowDictionary["soc-column"] = { "value": String(row.soc_percent) + socArrow, "color": socColor };
      rowDictionary["cost-column"] = { "value": String(trueCost), "color": color };
      rowDictionary["total-column"] = { "value": "£" + String(row.total_cost.toFixed(2)), "color": color };
      if (row.car_charging !== undefined && row.car_charging !== null)
        rowDictionary["car-column"] = { "value": String(row.car_charging), "color": color };
      if (row.clipped !== undefined && row.clipped !== null)
        rowDictionary["clip-column"] = { "value": String(row.clipped), "color": color };
      if (row.iboost !== undefined && row.iboost !== null)
        rowDictionary["iboost-column"] = { "value": String(row.iboost), "color": color };

      if (row.pv_forecast === null) throw new Error("row.pv_forecast is null");
      if (row.car_charging === undefined) throw new Error("row.car_charging is undefined");
      if (row.iboost === undefined) throw new Error("row.iboost is undefined");

      const netPower = (row.pv_forecast - row.load_forecast - row.car_charging - row.iboost).toFixed(2);

      rowDictionary["net-power-column"] = { "value": netPower, "color": color };

      // weather forecast
      if (this.forecast) {
        let weatherColor = "#FFFFFF"; // var(--primary-text-color)
        const match = this.findForecastForLabel(this.convertTimeStampToFriendly(row.time), this.forecast);
        if (match !== undefined && match !== null) {
          let matchStore = match;

          if (this._hass === undefined) throw new Error("_hass undefined");

          if (this.isLabelDuringNight(this.convertTimeStampToFriendly(row.time), this._hass) && match.condition === "partlycloudy")
            matchStore.condition = "partlycloudynight";

          if (this.config === undefined) throw new Error("this.config.weather_entity is undefined");
          if (this.config.weather_entity === undefined) throw new Error("this.config.weather_entity is undefined");

          const weatherEntity = this._hass.states[this.config.weather_entity];
          const tempUnit = weatherEntity?.attributes?.temperature_unit || this._hass.config.unit_system.temperature;

          if ((tempUnit === "°F" && match.temperature >= 77) || (tempUnit === "°C" && match.temperature >= 25))
            weatherColor = "rgb(220, 67, 20)";

          if ((tempUnit === "°F" && match.temperature <= 32) || (tempUnit === "°C" && match.temperature <= 0))
            weatherColor = "rgb(31, 136, 207)";

          rowDictionary["weather-column"] = { "value": matchStore, "color": weatherColor };
          rowDictionary["temp-column"] = { "value": matchStore, "color": weatherColor };
          rowDictionary["rain-column"] = { "value": matchStore, "color": weatherColor };
        } else {
          rowDictionary["weather-column"] = { "value": null, "color": 'transparent' };
          rowDictionary["temp-column"] = { "value": null, "color": 'transparent' };
          rowDictionary["rain-column"] = { "value": null, "color": 'transparent' };
        }
      }

      rowsToReturn.push(rowDictionary);
    }

    return rowsToReturn;

  }

  getArrayDataFromHTML(html: string, hassDarkMode: boolean) {

    // Define column headers and corresponding classes
    const headerClassesArray: ColumnKey[] = [
      'time-column',
      'import-column',
      'export-column',
      'state-column',
      'limit-column',
      'pv-column',
      'load-column',
      'soc-column',
      'cost-column',
      'total-column'
    ];

    let totalCostCalculated = 0;

    // Create a dummy element to manipulate the HTML
    const dummyElement = document.createElement('div');
    dummyElement.innerHTML = html;

    // Find all <tr> elements in the table body
    const trElements = dummyElement.querySelectorAll('tbody tr');

    // Loop through each <tr> element

    let rowCount = 0;

    const newDataObject: RowData[] = [];

    let currentExportRate: string;
    let currentExportColor: string;

    let firstRowData = 0;

    /*
    const str = "1.79 (0.75)";

    // Step 1: Use a regular expression to find all float numbers
    const floatRegex = /-?\d+(\.\d+)?/g; // This regex matches positive and negative floats
    const matches = str.match(floatRegex); // Get an array of matches

    // Step 2: Convert the matches to floating-point numbers
    const floats = matches.map(match => parseFloat(match));

    // Step 3: Loop through each float and do something with it
    floats.forEach(float => {
        console.log(float); // Here you can replace this line with whatever you want to do with each float
    });*/

    trElements.forEach((trElement, index) => {
      if (firstRowData === 0) {
        const numberOfChildren = trElement.children.length;

        //detect if row data is actual table data not metadata. If children <td> is greater than 2
        if (numberOfChildren > 2) {
          firstRowData = index;
        }
      }
    });

    let isCostReset = false;
    let currentCost = 0;
    let currentTotal = 0;
    let currentCostSet = false, currentTotalSet = false;

    trElements.forEach((trElement, index) => {

      const tdElements = trElement.querySelectorAll('td');
      const thElements = trElement.querySelectorAll('th');

      if (index === firstRowData) {

        let headerCountback = 0;
        let headerElements = trElement.querySelectorAll('th');
        if (tdElements.length > 0) {
          headerElements = trElement.querySelectorAll('td');
          headerCountback = 1;
        }

        //check for car column in the first row and add new car-column class to array in position 7
        headerElements.forEach((tdElement, checkIndex) => {
          let columnHeaderTitle = tdElement.innerHTML.toUpperCase();
          if (columnHeaderTitle.includes("CAR")) {
            headerClassesArray.splice(checkIndex - headerCountback, 0, "car-column");
          }
          if (columnHeaderTitle.includes("IBOOST")) {
            headerClassesArray.splice(checkIndex - headerCountback, 0, "iboost-column");
          }

          if (columnHeaderTitle.includes("CO2 G/KWH")) {
            headerClassesArray.splice(checkIndex - headerCountback, 0, "co2kwh-column");
          }

          if (columnHeaderTitle.includes("CO2 KG")) {
            headerClassesArray.splice(checkIndex - headerCountback, 0, "co2kg-column");
          }

          if (columnHeaderTitle.includes("XLOAD")) {
            headerClassesArray.splice(checkIndex - headerCountback, 0, "xload-column");
          }
          if (columnHeaderTitle.includes("CLIP KWH")) {
            headerClassesArray.splice(checkIndex - headerCountback, 0, "clip-column");
          }

        });

      }

      if (index > firstRowData && index < (trElements.length - 1)) {

        // helps with the math when columns count and colspan at work
        let countDifference = Object.keys(headerClassesArray).length - tdElements.length;

        let newTRObject: RowData = {};

        // Loop through each <td> element inside the current <tr>
        tdElements.forEach((tdElement, tdIndex) => {
          if (this.config === undefined) throw new Error("this.config is undefined");

          const userResetFlag = this.config.reset_day_totals;
          if (tdIndex === 0 && tdElement.innerHTML.includes("00:00") && userResetFlag)
            isCostReset = true;

          let bgColor = tdElement.getAttribute('bgcolor');

          if (bgColor === null) {
            bgColor = "#FFFFFF";
          }
          else {
            if (bgColor && !bgColor.startsWith('#')) {
              bgColor = `#${bgColor}`;
            }

            if (bgColor.toUpperCase() === "#FFFFFF" && tdIndex != 1 && tdIndex != 2 && (this.config.old_skool !== true) && this.getLightMode(hassDarkMode) !== true) bgColor = "var(--primary-text-color)";
          }

          if (this.getLightMode(hassDarkMode) === false && this.config.old_skool !== true) {

            // light mode active so adjust the colours from trefor
            bgColor = this.getDarkenHexColor(bgColor, 30);
          }

          if (tdIndex === 2) {
            currentExportRate = tdElement.innerHTML;
            currentExportColor = bgColor;
          }

          let headerIndex;
          if (tdIndex <= 2) {
            headerIndex = tdIndex
          } else {
            //2
            if (countDifference != 0) {
              headerIndex = tdIndex + countDifference;
            } else {
              headerIndex = tdIndex;
            }
          }

          // set the right bgColor if old_skool_columns are set, and valid.

          if (this.config.old_skool_columns !== undefined && this.config.old_skool_columns.length > 0 && this.config.old_skool_columns.includes(headerClassesArray[headerIndex])) {
            if (tdElement.getAttribute('bgcolor') != "#FFFFFF") {
              bgColor = tdElement.getAttribute('bgcolor');
            } else {
              bgColor = 'transparent';
            }
          }

          if (bgColor === null) throw new Error("bgColor is null");

          if (headerClassesArray[headerIndex] === "cost-column" && !isNaN(parseFloat(tdElement.innerHTML))) {
            currentCost = parseFloat(tdElement.innerHTML);
            currentCostSet = true;
          } else if (headerClassesArray[headerIndex] === "cost-column" && isNaN(parseFloat(tdElement.innerHTML))) {
            currentCost = 0;
            currentCostSet = true;
          }

          if (headerClassesArray[headerIndex] === "total-column" && !isNaN(parseFloat(tdElement.innerHTML))) {
            currentTotal = parseFloat(tdElement.innerHTML.replace(/[^0-9.\-]/g, ""));
            currentTotalSet = true;
          }

          if (headerClassesArray[headerIndex] === "cost-column" && !isNaN(parseFloat(tdElement.innerHTML)) && isCostReset)
            totalCostCalculated += parseFloat(tdElement.innerHTML);



          if (headerClassesArray[headerIndex] === "total-column") {

            let totalCostString;
            // calculate new cost
            if (isCostReset)
              totalCostString = "£" + ((totalCostCalculated - currentCost) / 100).toFixed(2);
            else
              totalCostString = tdElement.innerHTML;
            const temp = headerClassesArray[headerIndex];
            if (temp === undefined) throw new Error("headerClassesArray[headerIndex] is undefined");

            newTRObject[temp] = { "value": totalCostString, "color": bgColor };
          } else {
            const temp = headerClassesArray[headerIndex];
            if (temp === undefined) throw new Error("headerClassesArray[headerIndex] is undefined");

            newTRObject[temp] = { "value": tdElement.innerHTML, "color": bgColor };

            //exception||override for 12 cells and 11 headers (-1 count difference) and handling index 2
            if (countDifference < 0 && tdIndex == 3) {
              // having to do some nasty overrides here because of colspan stuff and my brain cant do the math today. will fix.
              const temp = headerClassesArray[2];
              if (temp === undefined) throw new Error("headerClassesArray[headerIndex] is undefined");
              newTRObject[temp] = { "value": currentExportRate, "color": currentExportColor };

            }

          };

          //if there are no state & limit cells because they are spanning rows, get the previous row data
          if (Object.keys(newTRObject).length < Object.keys(headerClassesArray).length) {
            if (headerClassesArray[3] === undefined) throw new Error("headerClassesArray[3] is undefined");
            if (headerClassesArray[4] === undefined) throw new Error("headerClassesArray[4] is undefined");
            if (newDataObject.length === 0) throw new Error("newDataObject is empty");

            const prevRow = newDataObject[newDataObject.length - 1];
            if (prevRow === undefined) throw new Error("prevRow is undefined");

            const stateValue = prevRow[headerClassesArray[3]];
            const limitValue = prevRow[headerClassesArray[4]];

            if (stateValue === undefined) throw new Error("stateValue is undefined");
            if (limitValue === undefined) throw new Error("limitValue is undefined");

            newTRObject[headerClassesArray[3]] = stateValue;
            newTRObject[headerClassesArray[4]] = limitValue;
          }

          // state is actually two states, so we should replace that with "both"
          if (countDifference < 0) {
            tdElements.forEach((tdElement, tdIndex) => {
              if (tdIndex === 3) {
                if (tdElement.innerHTML.includes("Chrg")) {
                  if (headerClassesArray[3] === undefined) throw new Error("headerClassesArray[3] is undefined");
                  newTRObject[headerClassesArray[3]] = { "value": "Both", "color": "green" };
                }
                else if (tdElement.innerHTML.trim() === "↘") {
                  if (headerClassesArray[3] === undefined) throw new Error("headerClassesArray[3] is undefined");
                  newTRObject[headerClassesArray[3]] = { "value": "Both-Dis", "color": "green" };
                }
                else if (tdElement.innerHTML.trim() === "↗") {
                  if (headerClassesArray[3] === undefined) throw new Error("headerClassesArray[3] is undefined");
                  newTRObject[headerClassesArray[3]] = { "value": "Both-Chg", "color": "green" };
                }
                else if (tdElement.innerHTML.trim() === "→") {
                  if (headerClassesArray[3] === undefined) throw new Error("headerClassesArray[3] is undefined");
                  newTRObject[headerClassesArray[3]] = { "value": "Both-Idle", "color": "green" };
                }
              }
              if (tdIndex === 4) {
                if (tdElement.innerHTML.includes("🐌")) {
                  if (headerClassesArray[3] === undefined) throw new Error("headerClassesArray[3] is undefined");
                  newTRObject[headerClassesArray[3]] = { "value": "Both-Dis-Snail", "color": "green" };
                }
              }
            });
          }

          if (headerClassesArray[1] === undefined) throw new Error("headerClassesArray[1] is undefined");
          if (headerClassesArray[2] === undefined) throw new Error("headerClassesArray[2] is undefined");

          const importValue = newTRObject[headerClassesArray[1]];
          const exportValue = newTRObject[headerClassesArray[2]];

          if (importValue === undefined) throw new Error("importValue is undefined");
          if (exportValue === undefined) throw new Error("exportValue is undefined");

          newTRObject["import-export-column"] = [importValue, exportValue];

          // weather forecast
          if (this.forecast) {
            let weatherColor = "#FFFFFF"; // var(--primary-text-color)

            if (newTRObject["time-column"] === undefined) throw new Error("newTRObject['time - column'] is undefined");

            const match = this.findForecastForLabel(newTRObject["time-column"].value, this.forecast);
            if (match !== undefined && match !== null) {
              let matchStore = match;

              if (this._hass === undefined) throw new Error("this._hass is undefined");

              if (this.isLabelDuringNight(newTRObject["time-column"].value, this._hass) && match.condition === "partlycloudy")
                matchStore.condition = "partlycloudynight";

              if (this.config.weather_entity === undefined) throw new Error("this.config.weather_entity is undefined");

              const weatherEntity = this._hass.states[this.config.weather_entity];
              const tempUnit = weatherEntity?.attributes?.temperature_unit || this._hass.config.unit_system.temperature;

              if ((tempUnit === "°F" && match.temperature >= 77) || (tempUnit === "°C" && match.temperature >= 25))
                weatherColor = "rgb(220, 67, 20)";

              if ((tempUnit === "°F" && match.temperature <= 32) || (tempUnit === "°C" && match.temperature <= 0))
                weatherColor = "rgb(31, 136, 207)";

              newTRObject["weather-column"] = { "value": matchStore, "color": weatherColor };
              newTRObject["temp-column"] = { "value": matchStore, "color": weatherColor };
              newTRObject["rain-column"] = { "value": matchStore, "color": weatherColor };
            } else {
              newTRObject["weather-column"] = { "value": null, "color": "transparent" };
              newTRObject["temp-column"] = { "value": null, "color": "transparent" };
              newTRObject["rain-column"] = { "value": null, "color": "transparent" };
            }

          }

          // net-power-column

          const loadIndex = headerClassesArray.indexOf("load-column");
          const pvIndex = headerClassesArray.indexOf("pv-column");
          const carIndex = headerClassesArray.indexOf("car-column");
          const iBoostIndex = headerClassesArray.indexOf("iboost-column");

          let pvValue = "0";
          let loadValue = "0";
          let carValue = "0";
          let iBoostValue = "0";

          if (pvIndex !== -1) {
            if (headerClassesArray[pvIndex] === undefined) throw new Error("headerClassesArray[pvIndex] is undefined");

            const tempNewTRObject = newTRObject[headerClassesArray[pvIndex]];

            if (tempNewTRObject === undefined) throw new Error("newTRObject[headerClassesArray[pvIndex]] is undefined");

            pvValue = tempNewTRObject.value.replace(/[☀]/g, '');
            if (pvValue.length === 0 || Number.isNaN(parseFloat(pvValue)))
              pvValue = "0";
          }

          if (loadIndex !== -1) {
            if (headerClassesArray[loadIndex] === undefined) throw new Error("headerClassesArray[loadIndex] is undefined");

            const tempNewTRObject = newTRObject[headerClassesArray[loadIndex]];

            if (tempNewTRObject === undefined) throw new Error("");

            loadValue = tempNewTRObject.value;
            if (loadValue.length === 0 || Number.isNaN(parseFloat(loadValue)))
              loadValue = "0";
          }

          if (carIndex !== -1) {
            if (headerClassesArray[carIndex] === undefined) throw new Error("headerClassesArray[carIndex] is undefined");

            const tempNewTRObject = newTRObject[headerClassesArray[carIndex]];

            if (tempNewTRObject === undefined) throw new Error("newTRObject[headerClassesArray[carIndex]] is undefined");

            carValue = tempNewTRObject.value;
            if (carValue.length === 0 || Number.isNaN(parseFloat(carValue)))
              carValue = "0";
          }
          if (iBoostIndex !== -1) {
            if (headerClassesArray[iBoostIndex] === undefined) throw new Error("headerClassesArray[iBoostIndex] is undefined");

            const tempNewTRObject = newTRObject[headerClassesArray[iBoostIndex]];

            if (tempNewTRObject === undefined) throw new Error("newTRObject[headerClassesArray[iBoostIndex]] is undefined");

            iBoostValue = tempNewTRObject.value;
            if (iBoostValue.length === 0 || Number.isNaN(parseFloat(iBoostValue)))
              iBoostValue = "0";
          }

          const netPower = Math.floor((parseFloat(pvValue) - parseFloat(loadValue) - parseFloat(carValue) - parseFloat(iBoostValue)) * 100) / 100;
          const positiveColor = "#3AEE85";
          const negativeColor = "#F18261";
          let adjustedColor;

          if (netPower > 0) {
            adjustedColor = positiveColor;
            if (this.getLightMode(hassDarkMode) === false && this.config.old_skool !== true)
              adjustedColor = this.getDarkenHexColor(positiveColor, 30);
            if (this.config.old_skool_columns !== undefined && this.config.old_skool_columns.length > 0 && this.config.old_skool_columns.includes("net-power-column"))
              adjustedColor = positiveColor;
          } else {
            adjustedColor = negativeColor;
            if (this.getLightMode(hassDarkMode) === false && this.config.old_skool !== true)
              adjustedColor = this.getDarkenHexColor(negativeColor, 30);

            if (this.config.old_skool_columns !== undefined && this.config.old_skool_columns.length > 0 && this.config.old_skool_columns.includes("net-power-column"))
              adjustedColor = negativeColor;
          }

          newTRObject["net-power-column"] = { "value": netPower, "color": adjustedColor };
          newDataObject.push(newTRObject);
        });

        if (index === (trElements.length - 1)) {
          console.warn("???");
        }

      };
    });

    return newDataObject;
  }

  getStringToDate(input: string) {
    const [day, time] = input.split(' '); // Split into "Tue" and "09:00"

    if (time === undefined) throw new Error("time is undefined");
    if (day === undefined) throw new Error("day is undefined");
    if (invalidDay(day)) throw new Error("day is not valid");

    const [hours, minutes] = time.split(':').map(Number); // Split and convert time to numbers

    if (hours === undefined) throw new Error("hours is undefined");

    const targetDay = weekdayMap[day as WeekdayKey];

    if (targetDay === undefined) {
      throw new Error('Invalid day in input');
    }

    // Get today's date
    const now = new Date();
    const currentDay = now.getDay();

    // Calculate the difference between today and the target day
    const dayDifference = (targetDay - currentDay + 7) % 7; // Ensures it's positive
    const targetDate = new Date(now);

    // Set the target date to the upcoming target day
    targetDate.setDate(now.getDate() + dayDifference);

    // Set the time
    targetDate.setHours(hours, minutes, 0, 0);

    return targetDate;
  }

  getStyles(isDarkMode: boolean) {

    //defaults
    let tableWidth = 100;
    let oddColour;
    let evenColour;
    let maxHeight = "28px";
    let tableHeaderFontColour;
    let tableHeaderBackgroundColour;
    let tableHeaderColumnsBackgroundColour;
    let boldTextDisplay, dayTotalFontColour, dayTotalBackgroundColour, totalBackgroundColour, dividerColour, tableBorderColor, planTotalFontColour, dayTotalShadowColor;

    if (this.config === undefined) throw new Error("this.config is undefined");

    if (isDarkMode) {
      oddColour = "#181f2a";
      evenColour = "#2a3240";
      tableHeaderColumnsBackgroundColour = evenColour;

      if (this.config.odd_row_colour !== undefined) {
        oddColour = this.config.odd_row_colour;
      }

      if (this.config.even_row_colour !== undefined) {
        evenColour = this.config.even_row_colour;
        tableHeaderColumnsBackgroundColour = this.config.even_row_colour;
      }
      tableHeaderFontColour = "#8a919e";
      tableHeaderBackgroundColour = "transparent";
      boldTextDisplay = "font-weight: normal;";
      dayTotalFontColour = "rgba(255, 255, 255, 0.7)";
      planTotalFontColour = "rgba(255, 255, 255, 1.0)";
      dayTotalBackgroundColour = evenColour;
      totalBackgroundColour = oddColour;
      dividerColour = "rgb(105, 109, 114)";
      tableBorderColor = "rgba(105, 109, 114, 0.6)";
      dayTotalShadowColor = "rgba(0, 0, 0, 0.7)";

    } else {
      // Light Theme
      //oddColour = "#d2d3db"; //848ea1
      //evenColour =  "#9394a5"; //2a3240

      oddColour = "#FFFFFF";
      evenColour = "#E5E5E5"

      if (this.config.odd_row_colour_light !== undefined) {
        oddColour = this.config.odd_row_colour_light;
      }

      if (this.config.even_row_colour_light !== undefined) {
        evenColour = this.config.even_row_colour_light;
      }
      tableHeaderFontColour = "#FFFFFF";
      tableHeaderBackgroundColour = "var(--primary-color)";
      tableHeaderColumnsBackgroundColour = "var(--primary-color)";
      boldTextDisplay = "font-weight: bold;";
      dayTotalFontColour = "var(--darker-primary-color)";
      planTotalFontColour = "rgba(255, 255, 255, 0.9)";
      dayTotalBackgroundColour = "var(--light-primary-color)";
      totalBackgroundColour = tableHeaderBackgroundColour;
      dividerColour = "var(--primary-color)";
      tableBorderColor = "var(--primary-color)";
      dayTotalShadowColor = "#FFFFFF";
    }

    //use yaml width if exists
    if (this.config.table_width !== undefined) {
      tableWidth = this.config.table_width;
    }

    if (this.config.columns !== undefined && this.config.columns.indexOf("import-export-column") >= 0) {
      if (this.config.stack_pills === true || this.config.stack_pills === undefined)
        maxHeight = "54px";
    }

    if (this.config.old_skool === true)
      maxHeight = "28px";

    let fontSize = 14;
    const tempSizeDiff = 3;
    let tempUnitSize = fontSize - tempSizeDiff;
    //use yaml font size if exists
    if (this.config.font_size !== undefined) {
      fontSize = this.config.font_size;
      tempUnitSize = parseFloat(this.config.font_size) - tempSizeDiff;
    }

    return `
    .card-content table {
      /* Your styles for the table inside .card-content */
      border: 1px solid ${tableBorderColor};
      width: ${tableWidth}%;
      border-spacing: 0px;
      font-size: ${fontSize}px;
    }

    .card-content table tbody tr:nth-child(even) {
        background-color: ${evenColour};
    }


    .card-content table tbody tr:nth-child(odd) {
      background-color:  ${oddColour};
    }

    .card-content table thead tr th {
        background-color: ${tableHeaderColumnsBackgroundColour};
        height: 28px;
        color: ${tableHeaderFontColour};
        text-align: center; !important
    }

    .tempUnit {
        font-size: ${tempUnitSize}px;
    }

    .totalRow {
        background-color: ${totalBackgroundColour} !important;
        height: 24px;
        color: ${planTotalFontColour};
        text-align: center !important;
        text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.7);
    }

    .totalRow td {
        border-top: 2px solid ${tableBorderColor} !important;
        border-bottom: 1px solid ${tableBorderColor} !important;
    }

    .dayTotalRow {
        background-color: ${dayTotalBackgroundColour} !important;
        height: 24px;
        color: ${dayTotalFontColour};
        text-align: center !important;
        text-shadow: 0px 1px 1px ${dayTotalShadowColor};
    }

    .lastUpdateRow {
        height: 24px;
        font-weight: normal;
        font-size: ${fontSize}px;
        text-align: center;
        padding-bottom: 4px;
    }

    .versionRow {
        height: 24px;
        font-weight: normal;
        text-align: center;
        padding-top: 4px;
        font-size: ${fontSize}px;
    }


    .card-content table thead tr .topHeader {
        background-color: ${tableHeaderColumnsBackgroundColour};
    }


    .daySplitter {
        height: 1px;
        background-color: ${dividerColour};
    }

    .card-content table tbody tr td {
        padding: 0px;
        padding-left: 2px;
        padding-right: 2px;
        height: ${maxHeight};
        vertical-align: middle;
        align-items: center;
        border: 0;
        text-align: center;
        white-space: nowrap;

    }

    .card-content table tbody tr td .pill {
       text-shadow: 0px 0px 0px rgba(0, 0, 0, 0.0);
    }

    .card-content table tbody tr td .icons {
    /*    filter: drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.6));*/
    }

    .card-content tbody tr td:nth-child(1) {
      white-space: normal;
    }


    #limitSVG {
      position: relative;
      top: 0px;
    }

    .iconContainer {
      display: flex;
      align-items: center; /* Center content vertically */
      justify-content: center; /* Center content horizontally */
      height: 100%; /* Set height of table cell */
      --font-weight: bold;
    }

    .iconContainerSOC {
      display: flex;
      align-items: center; /* Center content vertically */
    }

    .multiPillContainer {
      align-items: center; /* Center content vertically */
      justify-content: center; /* Center content horizontally */
      height: 54px; /* Set height of table cell */
      margin-top: 4px;

    }

    .pulse-icon {
      animation: pulse-opacity 1.1s infinite alternate;
    }

    .icon-spin {
        display: inline-block;
        animation: spin 1.8s linear infinite;
        transform-origin: 46% 56%;
    }

    @keyframes pulse-opacity {
        from {
            opacity: 0.2;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    `;
  }

  getLightModeColor(hexColor: string) {
    // Convert HEX color to RGB
    let r = parseInt(hexColor.substring(1, 3), 16);
    let g = parseInt(hexColor.substring(3, 5), 16);
    let b = parseInt(hexColor.substring(5, 7), 16);

    // Calculate the light mode color (increase each RGB component)
    let lightR = Math.min(r + 0, 255);
    let lightG = Math.min(g - 30, 255);
    let lightB = Math.min(b - 30, 255);

    // Convert the updated RGB values back to HEX
    let lightHexColor = '#' + ((1 << 24) + (lightR << 16) + (lightG << 8) + lightB).toString(16).slice(1);

    return lightHexColor;
  }

  getVibrantColor(hexColor: string, percent: number) {
    // Convert HEX color to RGB
    let r = parseInt(hexColor.substring(1, 3), 16);
    let g = parseInt(hexColor.substring(3, 5), 16);
    let b = parseInt(hexColor.substring(5, 7), 16);

    // Calculate the amount to increase the RGB values based on the percent vibrancy
    let increase = Math.round(percent / 100 * 255);

    // Increase the RGB values to make the color more vibrant
    r = Math.min(r + increase, 255);
    g = Math.min(g + increase, 255);
    b = Math.min(b + increase, 255);

    // Convert the updated RGB values back to HEX
    let vibrantHexColor = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

    return vibrantHexColor;
  }

  getDarkenHexColor(hexColor: string, percent: number) {


    // Ensure the percent is within the valid range
    percent = Math.max(0, Math.min(100, percent));

    // Convert HEX to RGB
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate the darkness factor
    let factor = 1 - percent / 100;

    // Darken the RGB values
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);

    // Ensure RGB values are within the valid range (0-255)
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Convert RGB back to HEX
    const darkenedHexColor = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;

    return darkenedHexColor;
  }

  getLightenHexColor(hexColor: string, percent: number) {
    // Ensure the percent is within the valid range
    percent = Math.max(0, Math.min(100, percent));

    // Convert HEX to RGB
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate the brightness factor
    let factor = 1 + percent / 100;

    // Lighten the RGB values
    r = Math.min(255, Math.round(r * factor));
    g = Math.min(255, Math.round(g * factor));
    b = Math.min(255, Math.round(b * factor));

    // Convert RGB back to HEX
    const lightenedHexColor = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;

    return lightenedHexColor;
  }
}

function getPrefix(entity: string): string {
  const prefixes = entity.match(/^[^.]+/);

  if (prefixes === null) throw new Error("prefixes not set");

  return prefixes[0];
}

function invalidDay(labelDayStr: string) {
  if (!["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(labelDayStr)) {
    return true;
  }

  return false;
}

customElements.define("predbat-table-card", PredbatTableCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "predbat-table-card",
  name: "PredBat TableCard",
  preview: true,
  description: "Predbat Card showing the plan table in a nicer format",
  documentationURL: "https://github.com/pacemaker82/PredBat-Table-Card/blob/main/README.md"
});

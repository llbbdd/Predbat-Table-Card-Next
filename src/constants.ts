import { ColumnKey } from './schemas/home-assistant';

export const htmlPlanEntity = 'predbat.plan_html';
export const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as const;
export const weekdayArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const cardHeight = 3;
export const columnsWithTotals: ColumnKey[] = [
  'load-column',
  'pv-column',
  'car-column',
  'iboost-column',
  'net-energy-column',
  'cost-column',
  'clip-column',
  'co2kg-column',
  'xload-column'
];
export const dayStart = { hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 };
export const dayEnd = { hour: 23, minute: 59, second: 59, millisecond: 999, microsecond: 999, nanosecond: 999 };
export const maxWeatherSubscriptionRetries = 10;
export const colourRangeForPrices = { upper: 30, lower: 0 };
export const white = 'rgb(255, 255, 255)';

export const allColumns = [
  'time-column',
  'soc-column',
  'limit-column',
  'import-column',
  'export-column',
  'pv-column',
  'state-column',
  'load-column',
  'xload-column',
  'clip-column',// TODO - render clip column
  'car-column',// TODO - render car column
  'iboost-column',
  'co2kg-column',
  'cost-column',
  'net-energy-column',
  'weather-column',
  'rain-column',
  'temp-column',
  'overrides-column',
  'overrides-popup-column'
] as const;

export const columnHeaderText: { [K in ColumnType]: string } = {
  'time-column': 'Time',
  'import-column': 'Import',
  'export-column': 'Export',
  'limit-column': 'Target SoC',
  'pv-column': 'PV',
  'load-column': 'Load',
  'soc-column': 'SoC',
  'cost-column': 'Cost',
  'weather-column': 'Weather',
  'overrides-column': 'Overrides',
  'overrides-popup-column': 'Overrides',
  'temp-column': 'Temp',
  'rain-column': 'Rain',
  'state-column': 'State',
  'clip-column': 'Clip',
  'car-column': 'Car',
  'iboost-column': 'iBoost',
  'co2kg-column': 'CO₂ (kg)',
  'xload-column': 'X Load',
  'net-energy-column': 'Surplus'
} as const;

export const columnHeaderIcon: { [K in ColumnType]: string } = {
  'time-column': 'clock-outline',
  'import-column': 'transmission-tower-export',
  'export-column': 'transmission-tower-import',
  'limit-column': 'battery-arrow-up',
  'pv-column': 'solar-power-variant',
  'load-column': 'home-lightning-bolt',
  'soc-column': 'battery',
  'cost-column': 'cash',
  'weather-column': 'weather-partly-cloudy',
  'overrides-column': 'cog',
  'overrides-popup-column': 'cog',
  'temp-column': 'thermometer',
  'rain-column': 'water',
  'state-column': 'traffic-light',
  'clip-column': 'content-cut',
  'car-column': 'car',
  'iboost-column': 'flash',
  'co2kg-column': 'molecule-co2',
  'xload-column': 'transmission-tower',
  'net-energy-column': 'flash'
} as const;

export type ColumnType = typeof allColumns[number];
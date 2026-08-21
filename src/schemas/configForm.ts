import type { Schema } from '../types/home-assistant';

export const configForm = {
  schema: [
    {
      name: 'columns',
      title: 'Visible Columns',
      required: true,
      selector: {
        select: {
          multiple: true,
          options: [
            { value: 'import-column', label: 'Import' },
            { value: 'export-column', label: 'Export' },
            { value: 'state-column', label: 'State' },
            { value: 'limit-column', label: 'Limit' },
            { value: 'pv-column', label: 'PV kWh' },
            { value: 'load-column', label: 'Load kWh' },
            { value: 'soc-column', label: 'Battery %' },
            { value: 'clip-column', label: 'Clip kWh' },
            { value: 'car-column', label: 'Car kWh' },
            { value: 'iboost-column', label: 'iBoost kWh' },
            { value: 'co2kg-column', label: 'CO2 kg' },
            { value: 'cost-column', label: 'Cost' },
            { value: 'xload-column', label: 'XLoad kWh' },
            { value: 'net-energy-column', label: 'Net kWh' },
            { value: 'weather-column', label: 'Weather' },
            { value: 'rain-column', label: 'Rain Chance' },
            { value: 'temp-column', label: 'Temperature' },
            { value: 'overrides-column', label: 'Override Buttons' }
          ]
        }
      },
      default: [
        'import-column',
        'export-column',
        'state-column',
        'limit-column',
        'pv-column',
        'load-column',
        'soc-column',
        'cost-column',
        'weather-column',
        'temp-column',
        'rain-column',
        'overrides-column'
      ]
    },
    {
      name: 'day_limit',
      selector: {
        number: {
          min: 1,
          max: 7,
          step: 1,
          mode: 'box'
        }
      },
      default: 2
    },
    {
      name: 'battery_lower_limit',
      selector: {
        number: {
          min: 0,
          max: 100,
          step: 1,
          mode: 'box'
        }
      },
      default: 0
    },
    { name: 'weather_entity', selector: { entity: {} } }

  ],
  computeLabel: (schema: Schema): string | undefined => {
    switch (schema.name) {
      case 'columns':
        return 'Visible Columns';
      case 'day_limit':
        return 'Days to show';
      case 'battery_lower_limit':
        return 'Lower battery limit';
      case 'weather_entity':
        return 'Weather Entity';
    }

    return undefined;
  },
  computeHelper: (schema: Schema): string | undefined => {
    switch (schema.name) {
      case 'columns':
        return 'Columns to display in table';
      case 'day_limit':
        return 'Number of days, from today, to display in table';
      case 'battery_lower_limit':
        return 'Optional - Only used for bar colours to narrow scale for higher definition';
      case 'weather_entity':
        return 'Optional - Home Assistant entity to use for weather forecast';
    }

    return undefined;
  }
};
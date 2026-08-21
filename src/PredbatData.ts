import { colourRangeForPrices, white, columnsWithTotals } from './constants';
import { ColumnKey } from './schemas/home-assistant';
import { PredbatRowData, RawData } from './schemas/predbat';
import { change } from './utils/entity-utils';
import { getColourFromScale } from './utils/general-utils';

export class PredbatData {
  private _plan: Map<string, PredbatRowData | null> | null = null;
  private _totals: Map<string, Partial<Record<ColumnKey, number>>> = new Map();
  private _hasData: Partial<Record<keyof PredbatRowData, boolean>> = {
    'load-column': false,
    'import-column': false,
    'export-column': false,
    'pv-column': false,
    'state-column': false,
    'limit-column': false,
    'soc-column': false,
    'cost-column': false,
    'car-column': false,
    'clip-column': false,
    'iboost-column': false,
    'net-energy-column': false,
    'co2kg-column': false,
    'xload-column': false
  };

  public constructor(validatedHistoricPlanData: RawData, validatedPlanData: RawData) {
    this._plan = new Map<string, PredbatRowData>();

    this._formatAndAddData(this._plan, validatedHistoricPlanData);
    this._formatAndAddData(this._plan, validatedPlanData);

    this._verifyPlan();
    this._calculateTotals();
  }

  public get plan(): Map<string, PredbatRowData | null> {
    if (this._plan === null) throw new Error('this._plan is null');

    return this._plan;
  }

  public get hasData(): Partial<Record<keyof PredbatRowData, boolean>> {
    return this._hasData;
  }

  public get totals(): Map<string, Partial<Record<ColumnKey, number>>> {
    return this._totals;
  }

  // Verify plan data, filling missing rows with null
  private _verifyPlan(): void {
    if (this._plan === null) throw new Error('No plan');

    const sortedEntries = Array.from(this._plan.entries())
      .sort((a, b) => Temporal.PlainDateTime.compare(
        Temporal.PlainDateTime.from(a[0]),
        Temporal.PlainDateTime.from(b[0])
      ));

    const newPlan = new Map<string, PredbatRowData | null>();

    for (const [timeString, data] of sortedEntries) {
      let keyToUse = timeString;

      if (!timeString.includes(':00:00') && !timeString.includes(':30:00')) {
        // timeString is off half-hour
        const currentTime = Temporal.PlainDateTime.from(timeString);
        const roundedTemporal = currentTime.with({
          minute: currentTime.minute < 30 ? 0 : 30,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0
        });

        keyToUse = roundedTemporal.toString();

        if (newPlan.has(keyToUse)) {
          console.warn(`Skipping off-half-hour entry ${timeString} (collides with ${keyToUse})`);

          continue;
        }
      }

      // Check if the modified time is 30 minutes after the last entry in newPlan
      if (newPlan.size > 0) {
        const lastKey = Array.from(newPlan.keys())[newPlan.size - 1];
        const lastTime = Temporal.PlainDateTime.from(lastKey);
        const currentModifiedTime = Temporal.PlainDateTime.from(keyToUse);
        const diffMinutes = lastTime.until(currentModifiedTime).total('minutes');

        if (diffMinutes > 30) {
          let fillTime = lastTime.add({ minutes: 30 });

          while (Temporal.PlainDateTime.compare(fillTime, currentModifiedTime) < 0) {
            const fillKey = fillTime.toString();

            console.warn(`Gap detected: ${diffMinutes} minutes between ${lastKey} and ${keyToUse} - Filling missing slot: ${fillKey} with null`);
            newPlan.set(fillKey, null);
            fillTime = fillTime.add({ minutes: 30 });
          }
        }
        else if (diffMinutes !== 30) {
          console.warn(`Skipping ${keyToUse}: not 30 minutes after ${lastKey} (${diffMinutes} minutes)`);

          continue;
        }
      }

      newPlan.set(keyToUse, data);
    }

    this._plan = newPlan;
  }

  private _formatAndAddData(tempMap: Map<string, PredbatRowData | null>, rawData: RawData): Map<string, PredbatRowData | null> {
    rawData.rows.forEach((row) => {
      if (row.load_forecast !== 0) this._hasData['load-column'] = true;
      if (row.import_rate !== 0) this._hasData['import-column'] = true;
      if (row.export_rate !== 0) this._hasData['export-column'] = true;
      if (row.pv_forecast !== null) this._hasData['pv-column'] = true;
      this._hasData['state-column'] = true;
      if (row.state_target !== '') this._hasData['limit-column'] = true;
      if (row.soc_percent > 0) this._hasData['soc-column'] = true;
      if (row.cost_change > 0) this._hasData['cost-column'] = true;
      if (row.car_charging !== undefined) this._hasData['car-column'] = true;
      if (row.clipped > 0) this._hasData['clip-column'] = true;
      if (row.iboost !== undefined) this._hasData['iboost-column'] = true;
      this._hasData['net-energy-column'] = true;
      if (row.carbon_intensity !== undefined) this._hasData['co2kg-column'] = true;
      if (row.extra_load > 0) this._hasData['xload-column'] = true;

      tempMap.set(Temporal.PlainDateTime.from(row.time).toString(), {
        'load-column': {
          value: row.load_forecast,
          colour: row.load_color
        },
        'import-column': row.import_rate_adjust_type !== undefined ? null : {
          value: row.import_rate,
          colour: getColourFromScale(colourRangeForPrices.lower, colourRangeForPrices.upper, String(row.import_rate), 'redToGreen', false)
        },
        'export-column': row.export_rate_adjust_type !== undefined ? null : {
          value: row.export_rate,
          colour: getColourFromScale(colourRangeForPrices.lower, colourRangeForPrices.upper, String(row.export_rate), 'redToGreen', false)
        },
        'pv-column': {
          // ASK - Predbat correctly predicts 0kWh PV after sundown, but records 0.01kWh once the time passes - Why?
          // Round down 0.01 to 0 to compensate for Predbat bug - This also removes the value from the daily total
          value: row.pv_forecast === 0.01 ? 0 : row.pv_forecast,
          colour: row.pv_color
        },
        'state-column': {
          value: row.state,
          colour: row.state_color
        },
        'limit-column': row.state_target === null ? null : {
          value: row.state_target,
          colour: white
        },
        'soc-column': {
          value: row.soc_percent,
          change: change(row.soc_change),
          colour: row.soc_color
        },
        'cost-column': {
          value: row.cost_change,
          change: change(row.cost_change),
          colour: row.cost_color
        },
        'car-column': row.car_charging === undefined ? null : {
          value: row.car_charging,
          colour: white
        },
        'clip-column': {
          value: row.clipped,
          colour: row.clipped_color
        },
        // ASK - how is predicted iBoost calculated? looks like final calculated value is just repeated, meaning net power and daily total is meaningless
        'iboost-column': {
          value: row.iboost ?? 0,
          colour: white
        },
        'net-energy-column': {
          value: Math.round(((row.pv_forecast ?? 0) - row.load_forecast - (row.car_charging ?? 0) - (row.iboost ?? 0)) * 100) / 100,
          colour: white
        },
        'co2kg-column': row.carbon_intensity === undefined ? null : {
          value: row.carbon_intensity / 1000,
          colour: row.carbon_intensity_color ?? white
        },
        'xload-column': {
          value: row.extra_load,
          colour: white
        }
      });
    });

    return tempMap;
  }

  // Import and export prices just repeat values once utility company stops providing prices so get time of last real value
  private _getLastNonCopyImportRateTime(raw: RawData): Temporal.PlainDateTime {
    // Get all rows where import_rate_adjust_type is not 'copy'
    const nonCopyRows = raw.rows.filter(row => row.import_rate_adjust_type !== 'copy');

    if (nonCopyRows.length === 0) throw new Error('No valid import rate data');

    // Get the last row (most recent)
    const lastRow = nonCopyRows[nonCopyRows.length - 1];

    return Temporal.PlainDateTime.from(lastRow.time);
  }

  private _calculateTotals(): void {
    if (this._plan === null) {
      return;
    }

    if (this._plan.size === 0) {
      return;
    }

    // Clear existing totals
    this._totals.clear();

    let tempTotals: Partial<Record<ColumnKey, number>> = {};
    let lastDate = '';

    this._plan.forEach((row, dateKey) => {
      const currentDate = dateKey.split('T')[0];

      // Check if this is a new day
      if (lastDate !== '' && lastDate !== currentDate) {
        this._totals.set(lastDate, tempTotals);
        tempTotals = {};
      }

      columnsWithTotals.forEach((columnWithTotal) => {
        if (row !== null) {
          const rowData = row[columnWithTotal as keyof PredbatRowData];

          if (rowData && typeof rowData.value === 'number') {
            const currentTotal = tempTotals[columnWithTotal] ?? 0;
            tempTotals[columnWithTotal] = currentTotal + rowData.value;
          }
        }
      });

      lastDate = currentDate;
    });

    // Store the last day's totals
    if (lastDate !== '' && Object.keys(tempTotals).length > 0) {
      this._totals.set(lastDate, tempTotals);
    }
  }
}
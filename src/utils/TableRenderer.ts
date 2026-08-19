import { allColumns } from '../constants';
import { PredbatData } from '../PredbatData';
import { HassEntity } from '../schemas/home-assistant';
import { PredbatRowData } from '../schemas/predbat';
import { WeatherRowData } from '../services/weather-service';
import { EntityObject, TemperatureUnit } from '../types/home-assistant';
import { ConfigManager } from './config-manager';
import { getArrayForEntityForceStates } from './entity-utils';
import { convertTimeStampToFriendly, formatFriendlyDate } from './general-utils';
import { weatherIconElement, spanElement, temperatureElement, rainChanceElement, tableCellElement, tableHeaderRowElement, tableElement, tableBodyElement, tableRowElement, editOveridesIconElement, overrideButtonsDivElement, divElement, overrideIconElement, modalCloseIcon, numberInputElement, buttonElement, errorCard, tableHeadElement, getOverrideIconStyles, infoCard, loadingCard, barElement, socBarElement } from './html-utils';

export class TableRenderer {
  private _configManager: ConfigManager;
  private _container: HTMLElement | null = null;
  private _onUpdateRequested: (() => void) | null = null;
  private _callInputNumberSetService: ((entityId: string, value: string) => Promise<void>) | null = null;
  private _callSelectOptionService: ((entityId: string, value: string) => Promise<void>) | null = null;
  private _state: Record<string, HassEntity | undefined> | null = null;

  // Column groupings - defined once here
  private readonly _columnGroups = {
    energy: ['pv-column', 'load-column', 'net-energy-column', 'car-column', 'iboost-column', 'clip-column', 'xload-column'],
    price: ['import-column', 'export-column'],
    percentage: ['soc-column', 'limit-column'],
    cost: ['cost-column', 'total-column'],
    co2: ['co2kg-column']
  };

  public constructor(configManager: ConfigManager) {
    this._configManager = configManager;
  }

  public set container(container: Element | null) {
    if (!(container instanceof HTMLDivElement)) throw new Error('Outer container not found or is not a div');

    this._container = container;
  }

  public set onUpdate(callback: () => void) {
    this._onUpdateRequested = callback;
  }

  public set callInputNumberSetService(callback: (entity_id: string, option: string) => Promise<void>) {
    this._callInputNumberSetService = callback;
  }

  public set callSelectOptionService(callback: (entity_id: string, option: string) => Promise<void>) {
    this._callSelectOptionService = callback;
  }

  public set state(state: Record<string, HassEntity | undefined>) {
    this._state = state;
  }

  public render(predbatData: PredbatData, temperatureUnit: TemperatureUnit, dayLimit: number, generatingPlan: boolean, carChargeSwitch: 'on' | 'off' | undefined, forceEntityObjects: EntityObject[], weather: Map<string, WeatherRowData> | null): void {
    if (this._container === null) return;

    const leftColumn = divElement('table-left-column');
    const leftTable = tableElement();
    const leftThead = tableHeadElement();
    const leftTableBody = tableBodyElement();

    const rightColumn = divElement('table-right-column');
    const rightTable = tableElement();
    const rightThead = tableHeadElement();
    const rightTableBody = tableBodyElement();

    // Remove columns that shouldn't be shown
    let rightColumns = this._configManager.visibleColumns
      .filter(col => weather !== null || (col !== 'weather-column' && col !== 'rain-column' && col !== 'temp-column'))
      .filter(col => col in predbatData.hasData ? predbatData.hasData[col as keyof PredbatRowData] === true : true);

    rightColumns = rightColumns.filter(col => col !== 'time-column');

    if (rightColumns.includes('overrides-column')) {
      // insert 'overrides-popup-column' after 'overrides-column' because css decides which to show - makes sure there's only one option in config instead of having to manually add both
      const optionsIndex = rightColumns.indexOf('overrides-column');
      rightColumns.splice(optionsIndex + 1, 0, 'overrides-popup-column');
    }

    const leftHeaderRow = tableHeaderRowElement(['time-column']);
    leftThead.appendChild(leftHeaderRow);
    leftTable.appendChild(leftThead);

    const rightHeaderRow = tableHeaderRowElement(rightColumns);
    rightThead.appendChild(rightHeaderRow);
    rightTable.appendChild(rightThead);

    // Move down rows
    const today = Temporal.Now.plainDateTimeISO().with({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0
    });

    const dayLimitTemporal = today.add({ days: dayLimit });

    for (const [timeValue, data] of predbatData.plan) {
      const rowTime = Temporal.PlainDateTime.from(timeValue);

      if (Temporal.PlainDateTime.compare(rowTime, today) < 0) continue;
      if (Temporal.PlainDateTime.compare(rowTime, dayLimitTemporal) >= 0) break;

      const isCurrentRow = this._isCurrentRow(timeValue);

      const leftRow = tableRowElement();
      const rightRow = tableRowElement();

      if (isCurrentRow) {
        leftRow.classList.add('current-time');
        rightRow.classList.add('current-time');
      }

      const leftCell = tableCellElement('time-column');
      const leftCellInner = spanElement('cellInner');

      const timeMatch = timeValue.match(/\d{2}:\d{2}/);

      if (timeMatch === null) throw new Error('Invalid time');

      const isStartOfDay = timeMatch[0] === '00:00';
      const isEndOfDay = timeMatch[0] === '23:30';
      const timeText = isStartOfDay ? formatFriendlyDate(timeValue) : timeMatch[0];
      const timeSpan = spanElement('datetime', undefined, timeText);
      leftCellInner.appendChild(timeSpan);

      if (isStartOfDay) {
        // Stop if there is no import/export price data
        const tempRowData = predbatData.plan.get(timeValue);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (tempRowData === undefined || tempRowData === null || tempRowData['import-column'] === null) break;

        // Mark as new day
        leftRow.classList.add('newDay');
        rightRow.classList.add('newDay');
      }

      leftCell.appendChild(leftCellInner);
      leftRow.appendChild(leftCell);
      leftTableBody.appendChild(leftRow);

      rightColumns.forEach((column) => {
        if (!allColumns.includes(column)) throw new Error(`Column ${column} not understood`);

        let columnData: PredbatRowData[keyof PredbatRowData] | null = null;

        if (column === 'weather-column' || column === 'rain-column' || column === 'temp-column') {
          // Inject weather data from forecast
          const now = Temporal.Now.plainDateTimeISO();
          const timeValueDate = Temporal.PlainDateTime.from(timeValue);
          const diffMinutes = timeValueDate.until(now).total('minutes');

          // If current time is more than 30 minutes newer than timeValue, skip (compensates for the rounding)
          if (diffMinutes > 30) {
            columnData = null;
          }
          else {
            const weatherKey = timeValue.substring(0, 13) + ':00:00';
            const tempValue = weather?.get(weatherKey)?.[column]?.value;
            const tempColour = weather?.get(weatherKey)?.[column]?.colour;

            if (tempValue === undefined || tempColour === undefined) {
              columnData = null;
            }
            else {
              if (column === 'weather-column') {
                columnData = { value: String(tempValue), colour: tempColour };
              }
              else {
                columnData = { value: tempValue as number, colour: tempColour };
              }
            }
          }
        }
        else if (column === 'time-column' || column === 'overrides-column' || column === 'overrides-popup-column') {
          // data object carries no information for these columns
        }
        else {
          // data object
          columnData = data?.[column] ?? null;
        }

        const newCell = tableCellElement(column);
        const cellInner = spanElement('cellInner');

        if (columnData !== null) {
          // Column-specific manipulation
          switch (column) {
            ////
            case 'export-column':
            case 'import-column': {
              if (typeof columnData.value !== 'number') throw new Error('import/export must be number');

              const maxValue = this._getColumnGroupMax(column, predbatData.plan);

              cellInner.appendChild(barElement(columnData.value, maxValue, columnData.colour, column === 'export-column', false));

              break;
            }
            ////
            case 'weather-column': {
              if (typeof columnData.value !== 'string') throw new Error('Invalid weather-column data');

              const iconElement = weatherIconElement(columnData.value);

              cellInner.style.color = columnData.colour;
              cellInner.className = 'iconContainer';
              cellInner.appendChild(iconElement);

              break;
            }
            ////
            case 'soc-column': {
              if (!('change' in columnData)) throw new Error('Invalid soc-column data');
              if (columnData.change !== 'rising' && columnData.change !== 'falling' && columnData.change !== 'same') throw new Error('Invalid soc-column data');
              if (typeof columnData.value !== 'number') throw new Error();

              const socElement = socBarElement(columnData.value, columnData.colour, columnData.change, this._configManager.batteryLowerLimit);

              cellInner.appendChild(socElement);

              break;
            }
            ////
            case 'temp-column': {
              if (typeof columnData.value !== 'number') throw new Error('Invalid temp-column data' + columnData.value);

              cellInner.appendChild(temperatureElement(columnData.value, columnData.colour, temperatureUnit));

              break;
            }
            ////
            case 'rain-column': {
              if (typeof columnData.value !== 'number') throw new Error('Invalid rain-column data' + columnData.value);

              cellInner.appendChild(rainChanceElement(columnData.value, columnData.colour));

              break;
            }
            default: {
              if (typeof columnData.value === 'number') {
                const maxValue = this._getColumnGroupMax(column, predbatData.plan);
                const invertBarColour = column === 'pv-column' || column === 'net-energy-column'; // low value is green, high is red; invert for low value is red, high is green

                cellInner.appendChild(barElement(columnData.value, maxValue, columnData.colour, invertBarColour, column !== 'cost-column'));
              }
              else {
                cellInner.style.color = columnData.colour;
                cellInner.textContent = String(columnData.value);
              }
            }
          }
        }
        else {
          // Non-data columns
          switch (column) {
            case 'overrides-popup-column': {
              const friendlyTimeValue = convertTimeStampToFriendly(timeValue);
              let isHighlighted = false;
              let activeEntity: EntityObject | null = null;

              const isClickable = this._checkRowIsAllowedForOverride(forceEntityObjects, friendlyTimeValue);

              for (const forceEntity of forceEntityObjects) {
                const tempEntity = this._getState(forceEntity.entityName);

                const settings = getArrayForEntityForceStates(tempEntity)
                  .map((s) => s.trim())
                  .filter(Boolean);

                const key = this._extractManualOverrideKey(forceEntity.entityName);

                const isActive = key === 'soc'
                  ? settings.some((entry) => entry.startsWith(`${friendlyTimeValue}=`))
                  : settings.includes(friendlyTimeValue);

                if (isActive) {
                  isHighlighted = true;
                  activeEntity = forceEntity;

                  break;
                }
              }

              const editOveridesIcon = activeEntity ? this._createButtonForOverrides(activeEntity, friendlyTimeValue, 18, false, isClickable) : editOveridesIconElement(isHighlighted, isClickable);

              if (isClickable) editOveridesIcon.addEventListener('click', () => this._createPopUpForOverrides(friendlyTimeValue, forceEntityObjects));

              cellInner.appendChild(editOveridesIcon);

              break;
            }
            case 'overrides-column': {
              const friendlyTimeValue = convertTimeStampToFriendly(timeValue);
              const isClickable = this._checkRowIsAllowedForOverride(forceEntityObjects, friendlyTimeValue);
              const overrideButtonsGroup = spanElement('overrideButtons');

              for (const forceEntity of forceEntityObjects) {
                const icon = this._createButtonForOverrides(forceEntity, friendlyTimeValue, 18, false, isClickable);

                overrideButtonsGroup.appendChild(icon);
              }

              cellInner.appendChild(overrideButtonsGroup);

              break;
            }
          }
        }

        newCell.appendChild(cellInner);
        rightRow.appendChild(newCell);
      });

      rightTableBody.appendChild(rightRow);

      if (isEndOfDay) {
        // Totals
        const previousDate = rowTime.toString().split('T')[0];
        const dayTotals = predbatData.totals.get(previousDate);

        if (dayTotals && Object.keys(dayTotals).length > 0) {
          const totalsLeftRow = tableRowElement();
          totalsLeftRow.classList.add('totals-row');
          const totalsLeftCell = tableCellElement('time-column');
          const totalsLeftCellInner = spanElement('cellInner');

          const totalsLabel = spanElement('datetime');
          totalsLeftCellInner.appendChild(totalsLabel);
          totalsLeftCell.appendChild(totalsLeftCellInner);
          totalsLeftRow.appendChild(totalsLeftCell);
          leftTableBody.appendChild(totalsLeftRow);

          const totalsRightRow = tableRowElement();
          totalsRightRow.classList.add('totals-row');

          rightColumns.forEach((column) => {
            const newCell = tableCellElement(column);
            const cellInner = spanElement('cellInner');
            const value = dayTotals[column];

            if (value !== undefined) {
              cellInner.textContent = value.toFixed(2);
              cellInner.classList.add('total-cell');
            }

            newCell.appendChild(cellInner);
            totalsRightRow.appendChild(newCell);
          });

          rightTableBody.appendChild(totalsRightRow);
        }
      }
    }

    leftTable.appendChild(leftTableBody);
    rightTable.appendChild(rightTableBody);

    leftColumn.appendChild(leftTable);
    rightColumn.appendChild(rightTable);

    // Replace existing content
    this._container.replaceChildren();
    this._container.appendChild(leftColumn);
    this._container.appendChild(rightColumn);

    // Equalize column widths for each group
    requestAnimationFrame(() => {
      if (this._container === null) throw new Error('this._container is null');

      for (const group of Object.values(this._columnGroups)) {
        this._equalizeColumnWidths(this._container, group);
      }
    });
  }

  public renderError = (message: string): void => {
    if (this._container === null) return;
    this._container.replaceChildren(errorCard(message, this._configManager.config));
  };

  public renderInfo = (message: string): void => {
    if (this._container === null) return;
    this._container.replaceChildren(infoCard(message, this._configManager.config));
  };

  public renderLoading = (message: string): void => {
    if (this._container === null) return;
    this._container.replaceChildren(loadingCard(message));
  };

  private _extractManualOverrideKey(entityName: string): string {
    return entityName.replace('select.predbat_manual_', '');
  }

  private _isCurrentRow(timeValue: string): boolean {
    const now = Temporal.Now.plainDateTimeISO();
    const timeValueDate = Temporal.PlainDateTime.from(timeValue);

    const minutes = now.minute;
    const currentSlotMinutes = minutes < 30 ? 0 : 30;
    const currentSlot = now.with({
      minute: currentSlotMinutes,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0
    });

    return Temporal.PlainDateTime.compare(timeValueDate, currentSlot) === 0;
  }

  private _getColumnGroupMax(column: string, plan: Map<string, PredbatRowData | null>): number {
    // Find which group this column belongs to
    let columnsToCheck: string[] = [column];

    for (const [, cols] of Object.entries(this._columnGroups)) {
      if (cols.includes(column)) {
        columnsToCheck = cols;

        break;
      }
    }

    let max = 0;
    let foundData = false;

    for (const [, data] of plan) {
      if (data === null) continue;

      for (const col of columnsToCheck) {
        const value = data[col as keyof PredbatRowData];

        if (value && typeof value.value === 'number') {
          foundData = true;

          const absValue = Math.abs(value.value);

          if (absValue > max) max = absValue;
        }
      }
    }

    if (!foundData || max === 0) return 1;

    return max;
  }

  private _createButtonForOverrides = (entityObject: EntityObject, timeForSelectOverride: string, size: number, fromPopup: boolean, isClickable: boolean): HTMLDivElement => {
    const key = this._extractManualOverrideKey(entityObject.entityName);
    const tempEntity = this._getState(entityObject.entityName);

    const settings = getArrayForEntityForceStates(tempEntity)
      .map((s) => s.trim())
      .filter(Boolean);

    let isActive: boolean;

    if (key === 'soc') {
      isActive = settings.some((entry) => entry.startsWith(`${timeForSelectOverride}=`));
    }
    else {
      isActive = settings.includes(timeForSelectOverride);
    }

    const styles = getOverrideIconStyles(entityObject, isActive, isClickable);

    const container = divElement('overrideButtonOuter');
    const iconWrapper = divElement('overrideButtonIconWrapper');

    // Main icon
    const iconEl = overrideIconElement(entityObject.entityIcon, entityObject.entityTitle, size, styles);

    if (isClickable) this._setupOverrideClickHandler(iconEl, entityObject.entityName, tempEntity, key, timeForSelectOverride, fromPopup);

    iconWrapper.appendChild(iconEl);

    container.appendChild(iconWrapper);
    container.dataset.forceKey = key;

    return container;
  };

  // Helper to setup click handler for override buttons
  private _setupOverrideClickHandler(
    iconEl: HTMLElement,
    entityName: string,
    tempEntity: HassEntity,
    key: string,
    timeForSelectOverride: string,
    fromPopup: boolean
  ): void {
    if (key === 'soc') {
      iconEl.addEventListener('click', async () => {
        if (this._callSelectOptionService === null) throw new Error('this._callSelectOptionService is null');

        const currentSettings = getArrayForEntityForceStates(tempEntity)
          .map((s) => s.trim())
          .filter(Boolean);

        const isSocActive = currentSettings.some((entry) => entry.startsWith(`${timeForSelectOverride}=`));

        if (isSocActive) {
          const remaining = currentSettings.filter((entry) => !entry.startsWith(`${timeForSelectOverride}=`));

          await this._setSettings(entityName, remaining);


          this._closePopupIfOpen(fromPopup);
          if (this._onUpdateRequested) this._onUpdateRequested();
        }
        else {
          this._closePopupIfOpen(fromPopup);
          const inputEntity = 'input_number.predbat_manual_soc_value';
          const entityState = this._getState(inputEntity);
          const socValue = entityState.state;
          this._createPopUpForSoCOverride(socValue, entityName, timeForSelectOverride);
        }
      });
    }
    else {
      iconEl.addEventListener('click', async () => {
        if (this._callSelectOptionService === null) throw new Error('this._callSelectOptionService is null');

        const currentSettings = getArrayForEntityForceStates(tempEntity);
        const isActive = currentSettings.includes(timeForSelectOverride);

        this._closePopupIfOpen(fromPopup);

        if (isActive) {
          const updatedSettings = currentSettings.filter(t => t !== timeForSelectOverride);

          await this._setSettings(entityName, updatedSettings);
        }
        else {
          await this._callSelectOptionService(entityName, timeForSelectOverride);
        }

        if (this._onUpdateRequested) this._onUpdateRequested();
      });
    }
  }

  private async _setSettings(entityName: string, settings: string[]): Promise<void> {
    if (this._callSelectOptionService === null) throw new Error('this._callSelectOptionService is null');

    const promises = [];

    promises.push(this._callSelectOptionService(entityName, 'off'));

    for (const entry of settings) {
      promises.push(this._callSelectOptionService(entityName, entry));
    }

    await Promise.all(promises);
  }

  // Helper to close popup if open
  private _closePopupIfOpen(fromPopup: boolean): void {
    if (!fromPopup) return;

    const closeButton = document.querySelector('#override-modal-overlay #modal-close-btn');

    if (closeButton instanceof HTMLElement) {
      closeButton.click();
    }
    else {
      const overlay = document.querySelector('#override-modal-overlay');

      if (overlay) overlay.remove();
    }
  }

  private _createPopUpForSoCOverride(socValue: string, entityName: string, timeForSelectOverride: string): void {
    this._openModal('soc-override-modal-overlay', (closeModal) => {
      const clickHandler = async (): Promise<void> => {
        if (this._callInputNumberSetService === null) throw new Error('this._callInputNumberSetService is null');
        if (this._callSelectOptionService === null) throw new Error('this._callSelectOptionService is null');

        const newValue = parseFloat(socOverideInput.value);

        if (Number.isNaN(newValue)) return;

        const formattedValue = newValue.toFixed(1);
        const promises = [];

        promises.push(this._callInputNumberSetService(entityName, formattedValue));

        const existingEntries = this._getState(entityName).state
          .replace(/^\+/, '')
          .split(',')
          .map((entry: string) => entry.trim())
          .filter(Boolean);

        const updatedEntries = existingEntries
          .filter((entry: string) => !entry.startsWith(`${timeForSelectOverride}=`));
        updatedEntries.push(`${timeForSelectOverride}=${formattedValue}`);

        promises.push(this._callSelectOptionService(entityName, updatedEntries.join(',')));

        await Promise.all(promises);

        closeModal();

        if (this._onUpdateRequested) this._onUpdateRequested();
      };

      const modalBox = divElement('modal');
      const socOverrideModal = divElement('socOverrideModal');
      const modalTitle = divElement('modalTitle');
      const modalTitleText = spanElement('modalTitleText', undefined, `Target SoC% for ${timeForSelectOverride}`);
      const closeButtonIcon = modalCloseIcon(closeModal);
      const socOverideInputOuter = divElement('socOverideInputOuter');
      const socOverideInput = numberInputElement('predbat-soc-target-input', 'predbat_soc_target', socValue, 'socOverideInput', 0, 100, 1);
      const saveButton = buttonElement('soc-override-save-btn', 'socOverideSaveButton', 'Override', clickHandler);

      modalBox.appendChild(modalTitle);
      modalTitle.appendChild(modalTitleText);
      modalBox.appendChild(closeButtonIcon);
      socOverrideModal.appendChild(socOverideInputOuter);
      socOverideInputOuter.appendChild(socOverideInput);
      socOverrideModal.appendChild(saveButton);
      modalBox.appendChild(socOverrideModal);

      return modalBox;
    });
  }

  private _createPopUpForOverrides(timeForSelectOverride: string, forceEntityObjects: EntityObject[]): void {
    this._openModal('override-modal-overlay', (closeModalCallback) => {
      const modalBox = divElement('modal');
      const bodyContainer = overrideButtonsDivElement(timeForSelectOverride, forceEntityObjects, 44, true, this._createButtonForOverrides);
      const modalTitle = divElement('modalTitle');
      const timestampElement = spanElement('modalTitleText', undefined, timeForSelectOverride);
      const closeIcon = modalCloseIcon(closeModalCallback);

      modalBox.appendChild(modalTitle);
      modalTitle.appendChild(timestampElement);
      modalBox.appendChild(closeIcon);
      modalBox.appendChild(bodyContainer);

      return modalBox;
    });
  }

  private _checkRowIsAllowedForOverride(forceEntityObjects: EntityObject[], timeForSelectOverride: string | null): boolean {
    let isAllowed = false;

    for (const forceEntity of forceEntityObjects) {
      const tempHassEntity = this._getState(forceEntity.entityName);
      const allowedOptions = tempHassEntity.attributes.options;

      if (timeForSelectOverride !== null && allowedOptions.includes(timeForSelectOverride)) {
        isAllowed = true;
        break;
      }
    }
    return isAllowed;
  }

  private _openModal(overlayId: string, buildModalBox: (closeModal: () => void) => HTMLElement | null): { overlay: HTMLDivElement; closeModal: () => void } | null {
    if (document.getElementById(overlayId)) return null;

    const overlay = divElement('modalOverlay', overlayId);

    let escHandler: ((e: KeyboardEvent) => void) | null = null;

    const closeModal = (): void => {
      overlay.remove();

      if (escHandler) document.removeEventListener('keydown', escHandler);
    };

    const modalBox = buildModalBox(closeModal);
    if (!modalBox) return null;

    modalBox.className = 'modal';

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    escHandler = (e): void => {
      if (e.key === 'Escape') closeModal();
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', escHandler);

    void overlay.offsetWidth;

    return { overlay, closeModal };
  }

  private _getState(entityId: string): HassEntity {
    if (this._state === null) throw new Error('this._state is null');

    const tempEntity = this._state[entityId];

    if (tempEntity === undefined) throw new Error('this._state is null');

    return tempEntity;
  }

  private _equalizeColumnWidths(container: HTMLElement, columnGroup: string[]): void {
    // Find all cells that belong to this column group
    const cells = container.querySelectorAll('td');
    const columnCells = new Map<string, HTMLTableCellElement[]>();

    // Group cells by column data attribute
    cells.forEach((cell) => {
      const column = cell.dataset.column;
      if (column !== undefined && columnGroup.includes(column)) {
        if (!columnCells.has(column)) {
          columnCells.set(column, []);
        }
        columnCells.get(column)?.push(cell);
      }
    });

    // Find the widest content width among all columns in the group
    let maxWidth = 0;
    columnCells.forEach((cellGroup) => {
      cellGroup.forEach((cell) => {
        const contentWidth = cell.scrollWidth;
        if (contentWidth > maxWidth) {
          maxWidth = contentWidth;
        }
      });
    });

    // Set all cells in the group to the same width
    columnCells.forEach((cellGroup) => {
      cellGroup.forEach((cell) => {
        cell.style.width = `${maxWidth}px`;
        cell.style.minWidth = `${maxWidth}px`;
        cell.style.maxWidth = `${maxWidth}px`;
      });
    });
  }
}
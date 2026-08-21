import { columnHeaderIcon, columnHeaderText, ColumnType } from '../constants';
import { ColumnKey } from '../schemas/home-assistant';
import { EntityObject, HaIcon, SoftwareVersion } from '../types/home-assistant';
import type { ConfigManager } from './config-manager';
import { isVersionGreater } from './general-utils';

export function tableElement(): HTMLTableElement {
  const table = document.createElement('table');
  table.id = 'predbat-table';
  table.className = 'predbat-table';

  return table;
}

export function tableBodyElement(): HTMLTableSectionElement {
  const tableBody = document.createElement('tbody');

  return tableBody;
}

export function tableCellElement(column: ColumnKey): HTMLTableCellElement {
  const tableCell = document.createElement('td');
  tableCell.className = 'tableCell';
  tableCell.dataset.column = column;

  return tableCell;
}

export function tableRowElement(): HTMLTableRowElement {
  const tableRow = document.createElement('tr');
  tableRow.className = 'tableRow';

  return tableRow;
}

export function tableHeaderRowElement(columns: string[]): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.className = 'topHeader';

  for (const column of columns) {
    const th = document.createElement('th');
    th.className = 'headerCell';
    if (column === 'time-column') th.classList.add('timeHeaderCell');
    th.dataset.column = column;

    const iconName = columnHeaderIcon[column as ColumnType];
    const icon = iconElement(iconName, undefined, 'header-icon');
    th.appendChild(icon);

    const text = spanElement('header-text', undefined, columnHeaderText[column as ColumnType]);
    th.appendChild(text);

    row.appendChild(th);
  }

  return row;
}

export function getVersionRowElement(predbatVersions: SoftwareVersion, cardVersions: SoftwareVersion): HTMLSpanElement {
  const versionRowOuter = spanElement('version-row-container');
  const predbatVersion = getVersionElement(predbatVersions, 'Predbat', 'left');
  const cardVersion = getVersionElement(cardVersions, 'Card', 'right');
  const statusElement = spanElement('status', undefined, undefined, 'status');
  const loadingStatusIconElement = loadingIconElement();
  const carChargingStatusElement = carChargingElement();

  statusElement.appendChild(carChargingStatusElement);
  statusElement.appendChild(loadingStatusIconElement);

  versionRowOuter.appendChild(predbatVersion);
  versionRowOuter.appendChild(statusElement);
  versionRowOuter.appendChild(cardVersion);

  return versionRowOuter;
}

export function toggleGeneratingPlan(context: HTMLElement, generating: boolean): void {
  if (generating) {
    context.querySelector('.reload-icon')?.classList.add('spin');
  }
  else {
    context.querySelector('.reload-icon')?.classList.remove('spin');
  }
}

export function toggleCarCharging(context: HTMLElement, charging: 'on' | 'off' | undefined): void {
  const carChargingElement = context.querySelector('.car-charging-icon');

  if (carChargingElement !== null) {
    if (charging === 'on') {
      carChargingElement.className = 'car-charging-on';
    }
    else if (charging === 'off') {
      carChargingElement.className = 'car-charging-off';
    }
    else {
      carChargingElement.className = 'car-charging-disabled';
    }
  }
}

export function getVersionElement(version: SoftwareVersion, label: string, alignment: 'left' | 'right'): HTMLSpanElement {
  const updateAvailable = version.installed !== null && isVersionGreater(version.latest, version.installed) ? ' (Update available)' : '';
  const versionElement = spanElement('versionSpan', undefined, `${label} v${version.installed}${updateAvailable}`);
  versionElement.style.textAlign = alignment;

  return versionElement;
}

export function spanElement(className: string, colour?: string, textContent?: string | number, id?: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = className;

  if (id !== undefined) span.id = id;
  if (colour !== undefined) span.style.color = colour;
  if (textContent !== undefined) span.textContent = String(textContent);

  return span;
}

export function divElement(className: string, id?: string): HTMLDivElement {
  const div = document.createElement('div');
  div.className = className;
  if (id !== undefined) div.id = id;

  return div;
}

export function tableHeadElement(): HTMLTableSectionElement {
  return document.createElement('thead');
}

export function haCardElement(): HTMLElement {
  const haCard = document.createElement('ha-card');
  haCard.className = 'outer-card-container';

  return haCard;
}

export function styleElement(id: string, styleString: string): HTMLStyleElement {
  const cardStyleTag = document.createElement('style');
  cardStyleTag.id = id;
  cardStyleTag.textContent = styleString;

  return cardStyleTag;
}

// Helper to create override buttons container with proper event handling
export function overrideButtonsDivElement(timeForSelectOverride: string, forceEntityObjects: EntityObject[], size: number, isClickable: boolean, createButtonForOverrides: (entityObject: EntityObject, timeForSelectOverride: string, size: number, fromPopup: boolean, isClickable: boolean) => HTMLDivElement): HTMLElement {
  const container = divElement('overrideButtons');

  for (const forceEntity of forceEntityObjects) {
    const icon = createButtonForOverrides(forceEntity, timeForSelectOverride, size, true, isClickable);

    container.appendChild(icon);
  }

  return container;
}

export function rainChanceElement(value: number, colour: string): HTMLSpanElement {
  return spanElement('iconContainer', colour, `${Math.round(value)}%`);
}

export function loadingIconElement(): HaIcon {
  return iconElement('reload', 16, 'reload-icon');
}

export function carChargingElement(): HaIcon {
  return iconElement('car', 16, 'car-charging-disabled');
}

export function temperatureElement(temperature: number, colour: string, temperatureUnit: string): HTMLSpanElement {
  const tempSpan = spanElement('iconContainer');
  const tempText = document.createTextNode(String(temperature));
  const unitSpan = spanElement('tempUnit', temperatureUnit);

  tempSpan.appendChild(tempText);
  tempSpan.appendChild(unitSpan);
  tempSpan.style.color = colour;

  return tempSpan;
}

export function batteryIconElement(percent: number): HaIcon {
  let iconString;

  const roundedPercent = Math.round(percent / 10) * 10;

  if (roundedPercent === 100) {
    iconString = 'battery';
  }
  else if (roundedPercent < 5) {
    iconString = 'battery-outline';
  }
  else {
    iconString = `battery-${roundedPercent}`;
  }

  return iconElement(iconString);
}

export function arrowIconElement(change: 'rising' | 'same' | 'falling'): HaIcon {
  let iconString;

  if (change === 'rising') {
    iconString = 'arrow-top-right-thin';
  }
  else if (change === 'falling') {
    iconString = 'arrow-bottom-right-thin';
  }
  else {
    iconString = 'arrow-right-thin';
  }

  return iconElement(iconString);
}

export function weatherIconElement(weather: string): HaIcon {
  const weatherIcon = ((): string => {
    switch (weather) {
      case 'partlycloudy': return 'weather-partly-cloudy';
      case 'partlycloudynight': return 'weather-night-partly-cloudy';
      case 'clear-night': return 'weather-night';
      case 'sunny': return 'weather-sunny';
      case 'cloudy': return 'weather-cloudy';
      case 'exceptional': return 'alert-outline';
      case 'fog': return 'weather-fog';
      case 'hail': return 'weather-hail';
      case 'lightning': return 'weather-lightning';
      case 'lightning-rainy': return 'weather-lightning-rainy';
      case 'pouring': return 'weather-pouring';
      case 'snowy': return 'weather-snowy';
      case 'snowy-rainy': return 'weather-snowy-rainy';
      case 'windy': return 'weather-windy';
      case 'windy-variant': return 'weather-windy-variant';
      case 'rainy': return 'weather-pouring';
      default: throw new Error('Weather condition not understood: ' + weather);
    }
  })();

  return iconElement(weatherIcon);
}

export function editOveridesIconElement(highlighted: boolean, isClickable: boolean): HaIcon {
  const icon = iconElement('application-edit-outline', undefined, 'editOverideIcon');
  icon.setAttribute('title', 'Battery Overrides');

  const styles = getOverrideIconStyles(null, highlighted, isClickable);
  icon.style.color = styles.colour;
  icon.style.opacity = styles.opacity;

  return icon;
}

// Helper to get icon state styles
export function getOverrideIconStyles(entityObject: EntityObject | null, isActive: boolean, isClickable: boolean): {
  colour: string;
  opacity: string;
} {
  const iconOpacityUnclickable = '0.1';
  const iconOpacityOff = '0.5';
  const iconOpacityOn = '1.00';
  let iconColourOff;
  let iconColourOn;

  if (entityObject?.entityName === 'select.predbat_manual_charge' || entityObject?.entityName === 'select.predbat_manual_export') {
    iconColourOff = 'rgb(20, 85, 47)';
    iconColourOn = 'rgb(58, 238, 133)';
  }
  else if (entityObject?.entityName === 'select.predbat_manual_freeze_charge' || entityObject?.entityName === 'select.predbat_manual_freeze_export') {
    iconColourOff = 'rgb(131, 37, 33)';
    iconColourOn = 'rgb(238, 67, 58)';
  }
  else {
    iconColourOff = 'rgb(75, 80, 87)';
    iconColourOn = 'rgb(58, 238, 133)';
  }

  return {
    colour: isActive ? iconColourOn : iconColourOff,
    opacity: isActive ? iconOpacityOn : isClickable ? iconOpacityOff : iconOpacityUnclickable
  };
}

function iconElement(iconString: string, size = 18, className?: string): HaIcon {
  const icon = document.createElement('ha-icon');
  icon.setAttribute('icon', `mdi:${iconString}`);
  if (className !== undefined) icon.className = className;
  icon.style.setProperty('--mdc-icon-size', `${size}px`);

  return icon;
}

export function overrideIconElement(iconString: string, iconTitle: string, size: number, styles: { colour: string; opacity: string; }): HaIcon {
  const icon = iconElement(iconString, size, 'overrideButtonIcon');
  icon.title = iconTitle;
  icon.style.color = styles.colour;
  icon.style.opacity = styles.opacity;

  return icon;
}

export function modalCloseIcon(closeModalCallback: () => void): HaIcon {
  const icon = iconElement('close-circle-outline', 32, 'modalCloseIcon');
  icon.id = 'modal-close-btn';
  icon.title = 'Battery Overrides';

  icon.addEventListener('click', closeModalCallback);

  return icon;
}

export function numberInputElement(id: string, name: string, value: string, className: string, min: number, max: number, step: number): HTMLInputElement {
  const inputElement = document.createElement('input');
  inputElement.id = id;
  inputElement.type = 'number';
  inputElement.min = String(min);
  inputElement.max = String(max);
  inputElement.step = String(step);
  inputElement.name = name;
  inputElement.value = value;
  inputElement.className = className;

  return inputElement;
}

export function buttonElement(id: string, classname: string, text: string, clickCallback: () => Promise<void>): HTMLButtonElement {
  const buttonElement = document.createElement('button');
  buttonElement.id = id;
  buttonElement.className = classname;
  buttonElement.textContent = text;

  buttonElement.addEventListener('click', clickCallback);

  return buttonElement;
}

type MessageType = 'error' | 'info';

export function messageCard(message: string, config: ConfigManager['config'], type: MessageType = 'error'): HTMLDivElement {
  const container = document.createElement('div');
  container.className = type === 'error' ? 'error-card' : 'info-card';
  container.textContent = message;
  return container;
}

export function errorCard(message: string, config: ConfigManager['config']): HTMLDivElement {
  return messageCard(message, config, 'error');
}

export function infoCard(message: string, config: ConfigManager['config']): HTMLDivElement {
  return messageCard(message, config, 'info');
}

export function loadingCard(message: string): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'loading-container';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';

  const text = document.createElement('div');
  text.className = 'loading-text';
  text.textContent = message;

  container.appendChild(spinner);
  container.appendChild(text);
  return container;
}

export function socBarElement(value: number, colour: string, change: 'rising' | 'same' | 'falling', batteryMinSoC = 0): HTMLDivElement {
  const container = divElement('bar-element-container');
  const clampedValue = Math.min(Math.max(value, batteryMinSoC), 100);
  const range = 100 - batteryMinSoC;
  const percentageInRange = range > 0 ? ((clampedValue - batteryMinSoC) / range) * 100 : 100;
  const green = Math.round((percentageInRange / 100) * 255);
  const red = 255 - green;
  const scaledColour = `rgb(${red}, ${green}, 0)`;
  const barFill = divElement('bar-element-fill');
  barFill.style.width = `${Math.min(Math.max(value, 0), 100)}%`;
  barFill.style.background = scaledColour;

  const contentWrapper = divElement('bar-element-content-wrapper');

  const valueSpan = spanElement('batterySoC', undefined, value);

  const arrowContainer = spanElement('iconContainerSOC');
  arrowContainer.appendChild(arrowIconElement(change));

  contentWrapper.appendChild(valueSpan);
  contentWrapper.appendChild(arrowContainer);
  container.appendChild(barFill);
  container.appendChild(contentWrapper);

  return container;
}

export function barElement(value: number, maxValue: number, colour: string, inverted: boolean, hideZero: boolean): HTMLDivElement {
  if (maxValue <= 0) throw new Error(`maxValue is ${maxValue}`);

  const container = divElement('bar-element-container');
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const percentage = Math.min(Math.max((absValue / maxValue) * 100, 0), 100);

  let barColour: string;
  const badColour = '#f00';

  if (isNegative) {
    barColour = badColour;
  }
  else if (inverted) {
    const green = Math.round((percentage / 100) * 255);
    const red = 255 - green;

    barColour = `rgb(${red}, ${green}, 0)`;
  }
  else {
    const red = Math.round((percentage / 100) * 255);
    const green = 255 - red;

    barColour = `rgb(${red}, ${green}, 0)`;
  }

  const barFill = divElement('bar-element-fill');
  barFill.style.width = `${percentage}%`;
  barFill.style.background = barColour;
  barFill.style.opacity = isNegative ? '0.25' : '0.3';
  if (isNegative) barFill.style.borderLeft = `2px solid ${badColour}`;

  const valueText = spanElement('bar-element-value', isNegative ? badColour : 'var(--primary-text-color, #000)', value === 0 && hideZero ? undefined : value);

  container.appendChild(barFill);
  container.appendChild(valueText);

  return container;
}
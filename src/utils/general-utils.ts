import semver from 'semver';
import { logger } from './logger';
import { Temporal } from '@js-temporal/polyfill';

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

export function convertTimeStampToFriendly(dateString: string): string {
  const normalised = normaliseOffset(dateString);

  let instant: Temporal.Instant;

  try {
    instant = Temporal.Instant.from(normalised);
  }
  catch {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  const parts = weekdayFormatter.formatToParts(new Date(instant.epochMilliseconds));
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find(part => part.type === type)?.value ?? '';

  return `${get('weekday')} ${get('hour')}:${get('minute')}`;
}

export function extractTimeFromFriendlySlot(friendlySlot: string): string {
  const match = friendlySlot.match(/(\d{2}:\d{2})$/);
  if (match === null) throw new Error(`Invalid friendly slot "${friendlySlot}"`);

  return match[1];
}

export function friendlySlotToPlainDateTime(friendlySlot: string): Temporal.PlainDateTime | null {
  const match = friendlySlot.match(/^(\w{3}) (\d{2}):(\d{2})$/);
  if (match === null) return null;

  const dayAbbrev = match[1];
  const hour = Number(match[2]);
  const minute = Number(match[3]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const now = Temporal.Now.plainDateTimeISO();

  for (let offset = 0; offset < 7; offset++) {
    const candidate = now.add({ days: offset }).with({
      hour,
      minute,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0
    });

    if (candidate.toLocaleString('en-GB', { weekday: 'short' }) === dayAbbrev) {
      return candidate;
    }
  }

  return null;
}

function normaliseOffset(dateString: string): string {
  const suffix = dateString.slice(-6);

  // Already colonised: ±HH:MM
  if (/^[+-]\d{2}:\d{2}$/.test(suffix)) {
    return dateString;
  }

  // Basic format: ±HHMM (Predbat's usual output)
  if (/^[+-]\d{4}$/.test(suffix.slice(-5))) {
    return `${dateString.slice(0, -5)}${dateString.slice(-5, -2)}:${dateString.slice(-2)}`;
  }

  // Trailing Z
  if (dateString.endsWith('Z')) {
    return dateString;
  }

  // Bare timestamp (no offset)
  // Predbat emits these for naive datetimes
  // Treat as UTC so the formatter renders the wall-clock digits Predbat wrote
  return `${dateString}Z`;
}

export function cleanAndValidateVersion(version: string | undefined): string | null {
  if (version === undefined) return null;

  const cleaned = semver.clean(version);

  if (cleaned === null) {
    logger.warn(`Invalid version format: ${version}`);

    return null;
  }

  return cleaned;
}

export function formatTotal(column: string, value: number): string {
  if (column === 'cost-column' || column === 'total-column') {
    const pounds = value / 100;

    return pounds < 0 ? `-£${Math.abs(pounds).toFixed(2)}` : `£${pounds.toFixed(2)}`;
  }

  return value.toFixed(2);
}

export function getColourFromScale(scaleMinimum: number, scaleMaximum: number, valueInPence: string, colourScheme: 'redToGreen' | 'redToBlue', reverse = false): string {
  const value = parseFloat(valueInPence);

  if (isNaN(value)) {
    throw new Error(`Price value is invalid: ${value}`);
  }

  if (value > scaleMinimum) {
    const clamped = Math.min(value, scaleMaximum);
    const ratio = clamped / scaleMaximum;

    let r: number, g: number, b: number;

    if (colourScheme === 'redToBlue') {
      // Red to Blue gradient
      // Low = red, high = blue
      const adjustedRatio = reverse ? (1 - ratio) : ratio;
      r = Math.round(220 - (adjustedRatio * 189));  // 220 -> 31
      g = Math.round(67 + (adjustedRatio * 69));    // 67 -> 136
      b = Math.round(20 + (adjustedRatio * 187));   // 20 -> 207
    }
    else {
      // Red to Green gradient (original behaviour)
      if (reverse) {
        // Reversed: value high = green, value low = red
        r = Math.round(75 + ((1 - ratio) * 180));
        g = Math.round(180 - ((1 - ratio) * 180));
        b = Math.round(75 - ((1 - ratio) * 75));
      }
      else {
        // Normal: value low = green, value high = red
        r = Math.round(75 + (ratio * 180));
        g = Math.round(180 - (ratio * 180));
        b = Math.round(75 - (ratio * 75));
      }
    }

    return `rgb(${r}, ${g}, ${b})`;
  }

  // Below minimum values
  if (colourScheme === 'redToBlue') return reverse ? 'rgb(31, 136, 207)' : 'rgb(220, 67, 20)';

  return reverse ? 'rgb(255, 251, 0)' : 'rgb(34, 109, 201)';
}

export function formatFriendlyDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let datePart = '';

  if (dateToCheck.getTime() === today.getTime()) {
    datePart = 'Today';
  }
  else if (dateToCheck.getTime() === tomorrow.getTime()) {
    datePart = 'Tom.';
  }
  else {
    const diffTime = dateToCheck.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      datePart = `${diffDays} days`;
    }
    else {
      throw new Error('Date error');
    }
  }

  const timePart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  return `${datePart} ${timePart}`;
}
import isSemver from 'is-semver';
import { weekdayArray, weekdayMap } from '../constants';
import type { CellValue, WeekdayKey } from '../types/home-assistant';

export function invalidDay(labelDayStr: string): boolean {
  if (!weekdayArray.includes(labelDayStr)) return true;

  return false;
}

export function isError(error: unknown): error is Error {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string';
}

export function dateStringHasTimezoneOffset(val: string): boolean {
  if (!/[+-]\d{2}:\d{2}$/.test(val) && !/[+-]\d{4}$/.test(val)) {
    return false;
  }

  return true;
}

export function convertTimeStampToFriendly(dateString: string): string {
  // Fix timezone colon if missing (e.g., +0000 → +00:00)
  const date = new Date(fixTimezoneOffset(dateString));

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return formatter.format(date).replace(',', '');
}

export function fixTimezoneOffset(dateString: string): string {
  return dateString.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
}

// is latestVersion > currentVersion?
export function isVersionGreater(latestVersion: string | null, currentVersion: string): boolean {
  if (latestVersion === null) return false;

  const pa = latestVersion.replace(/^v/, '').split('.').map(Number);
  const pb = currentVersion.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return false;
}

export function cleanAndValidateVersion(version: string | undefined): string | null {
  if (version === undefined) return null;

  const trimmed = version.trim();

  if (trimmed === '') return null;

  const cleaned = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;

  if (!isSemver(cleaned)) {
    console.warn(`Invalid version format: ${version}`);

    return null;
  }

  return cleaned;
};

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

export function getStringToDate(input: string): Date {
  const [day, time] = input.split(' '); // Split into "Tue" and "09:00"

  if (invalidDay(day)) throw new Error('day is not valid');

  const [hours, minutes] = time.split(':').map(Number); // Split and convert time to numbers

  // Validate time values
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const targetDay = weekdayMap[day as WeekdayKey];

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

export function getDayFromTimeColumnValue(timeColumnCell: CellValue): string {
  const day = timeColumnCell.value.split(' ')[0];

  if (!weekdayArray.includes(day)) throw new Error(`TimeColumnValue not understood: ${timeColumnCell.value}`);

  return day;
}

export function _formatLocalTime(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const offMins = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${offHours}${offMins}`;
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

// This is a temporary check to highlight a missing row of data sent from Predbat
// XX:00 to XX:29 will include full history
// e.g last row of history is (correctly) 1530 at 1605, but is (incorrectly) still 1530 at 1635 - 1600 is missing
export function isWithinLastHalfHour(dateString: string): void {
  const now = Temporal.Now.plainDateTimeISO();
  const minutes = now.minute;
  const roundedMinutes = minutes < 30 ? 0 : 30;

  const roundedNow = now.with({
    minute: roundedMinutes,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0
  });

  const thirtyMinutesAgo = roundedNow.subtract({ minutes: 30 });
  const dateToCheck = Temporal.PlainDateTime.from(dateString);

  if (Temporal.PlainDateTime.compare(dateToCheck, thirtyMinutesAgo) < 0) {
    console.error(
      `Predbat has not returned full history data. Expected data from ${thirtyMinutesAgo.toString()}, but latest received is ${dateToCheck.toString()}`
    );
  }
}
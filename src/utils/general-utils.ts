import semver from 'semver';
import { logger } from './logger';

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

function fixTimezoneOffset(dateString: string): string {
  return dateString.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
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
/* eslint-disable no-console */
const LABEL = '[predbat-card-next]';

const LABEL_STYLE = [
  'background: #000',
  'color: #ff69b4',
  'font-weight: bold',
  'padding: 1px 4px',
  'border-radius: 2px'
].join(';');

const prefix = `%c${LABEL}`;

export const logger = {
  log: (...args: unknown[]): void => {
    console.log(prefix, LABEL_STYLE, ...args);
  },
  info: (...args: unknown[]): void => {
    console.info(prefix, LABEL_STYLE, ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(prefix, LABEL_STYLE, ...args);
  },
  error: (...args: unknown[]): void => {
    console.error(prefix, LABEL_STYLE, ...args);
  }
};
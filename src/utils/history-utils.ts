import type { HistoryState } from '../types/home-assistant';

export function getLastCompletedOnRun(history: HistoryState[]): { ms: number; start: Date; end: Date } | null {
  if (!Array.isArray(history) || history.length < 2) return null;

  for (let offIdx = history.length - 1; offIdx >= 0; offIdx--) {
    const offItem = history[offIdx];

    if (offItem.state !== 'off') continue;

    for (let onIdx = offIdx - 1; onIdx >= 0; onIdx--) {
      const onItem = history[onIdx];
      const s = onItem.state;

      if (s === 'on') {
        const start = new Date(onItem.last_changed);
        const end = new Date(offItem.last_changed);
        const ms = end.getTime() - start.getTime();
        return ms > 0 ? { ms, start, end } : null;
      }
      if (s === 'off') break;
    }
  }
  return null;
}
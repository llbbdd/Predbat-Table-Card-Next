import z from 'zod';
import { PredbatData } from '../PredbatData';
import { RawData, PredbatRawDataSchema } from '../schemas/predbat';
import { logger } from '../utils/logger';

export class PredbatRestApiService {
  private _dataCallback: ((predbatData: PredbatData) => void) | null;
  private _iboostHistoryProvider: () => Promise<Map<string, number> | null>;
  private _port: number;
  private _updateInterval: ReturnType<typeof setInterval> | null = null;
  private _retryTimeout: ReturnType<typeof setInterval> | null = null;
  private _initialUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private _isAvailable = false;
  private _fetchInProgress = false;

  public constructor(port: number, dataCallback: (predbatData: PredbatData) => void, iboostHistoryProvider: () => Promise<Map<string, number> | null>) {
    this._port = port;
    this._dataCallback = dataCallback;
    this._iboostHistoryProvider = iboostHistoryProvider;
    this._startPolling();
  }

  private _startPolling(): void {
    void this._fetchData();

    this._retryTimeout = setInterval(() => {
      if (!this._isAvailable && !this._fetchInProgress) {
        void this._fetchData();
      }
      else if (this._isAvailable) {
        if (this._retryTimeout) {
          clearInterval(this._retryTimeout);
          this._retryTimeout = null;
        }
      }
    }, 1000);
  }

  private async _fetchData(): Promise<void> {
    if (this._fetchInProgress) return;
    this._fetchInProgress = true;

    try {
      const planData = await this._getPlanData(this._port);

      if (planData?.yesterday === undefined) {
        logger.warn('No data received from Predbat API');

        return;
      }

      const validatedHistoricPlanData: RawData = PredbatRawDataSchema.parse(planData.yesterday);
      const validatedPlanData: RawData = PredbatRawDataSchema.parse(planData.plan);

      let iboostHistory: Map<string, number> | null = null;

      try {
        iboostHistory = await this._iboostHistoryProvider();
      }
      catch (error) {
        logger.warn('Failed to fetch iBoost history', error);
      }

      if (this._dataCallback === null) throw new Error('this._dataCallback is null');

      this._dataCallback(new PredbatData(validatedHistoricPlanData, validatedPlanData, iboostHistory));

      if (!this._isAvailable) {
        logger.info('Successfully fetched Predbat API data');

        this._isAvailable = true;
        this._scheduleHalfHourUpdate(5);
      }
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error(`PredbatRestApiService._fetchData failed to parse plan data: ${message}`, error);

      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          logger.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
        }
      }
    }
    finally {
      this._fetchInProgress = false;
    }
  }

  private _scheduleHalfHourUpdate(updateIntervalMinutes: number): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }

    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinute = minutes < 30 ? 30 : 0;
    const nextHour = minutes < 30 ? now.getHours() : now.getHours() + 1;

    const nextUpdate = new Date(now);
    nextUpdate.setHours(nextHour, nextMinute, 0, 0);
    const delay = nextUpdate.getTime() - now.getTime() + 5000;

    this._initialUpdateTimeout = setTimeout(() => {
      this._initialUpdateTimeout = null;
      void this._fetchData();
      this._updateInterval = setInterval(() => {
        void this._fetchData();
      }, updateIntervalMinutes * 60 * 1000);
    }, delay);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getPlanData(port: number): Promise<any> {
    return fetch(`http://${window.location.hostname}:${port}/api/plan_data`)
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        throw new Error(error);
      });
  }

  public static restApiAvailable(port: number): Promise<boolean> {
    return fetch(`http://${window.location.hostname}:${port}/api/plan_data`)
      .then(async (response) => {
        if (!response.ok) {
          logger.info('Using HASS state for Predbat plan data');

          return false;
        }

        await response.json();

        logger.info('Using REST API for Predbat data');

        return true;
      })
      .catch(() => {
        logger.info('Using HASS state for Predbat data');

        return false;
      });
  }

  public disconnect(): void {
    if (this._retryTimeout) {
      clearInterval(this._retryTimeout);
      this._retryTimeout = null;
    }

    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }

    if (this._initialUpdateTimeout) {
      clearTimeout(this._initialUpdateTimeout);
      this._initialUpdateTimeout = null;
    }

    this._dataCallback = null;
    this._isAvailable = false;
  }
}
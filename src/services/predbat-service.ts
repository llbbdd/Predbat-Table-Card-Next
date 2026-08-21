import { RawData, PredbatRawDataSchema } from '../schemas/predbat';

export class PredbatService {
  private _dataCallback: ((validatedHistoricPlanData: RawData, validatedPlanData: RawData) => void) | null;
  private _port: number;
  private _updateInterval: ReturnType<typeof setInterval> | null = null;
  private _retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private _isAvailable = false;
  private _fetchInProgress = false;

  public constructor(port: number, dataCallback: (validatedHistoricPlanData: RawData, validatedPlanData: RawData) => void) {
    this._port = port;
    this._dataCallback = dataCallback;
    this._startPolling();
  }

  private _startPolling(): void {
    this._fetchData();

    this._retryTimeout = setInterval(() => {
      if (!this._isAvailable && !this._fetchInProgress) {
        this._fetchData();
      }
      else if (this._isAvailable) {
        if (this._retryTimeout) {
          clearInterval(this._retryTimeout);
          this._retryTimeout = null;
        }
      }
    }, 1000);
  }

  private _fetchData(): void {
    if (this._fetchInProgress) return;
    this._fetchInProgress = true;

    this._getPlanData(this._port)
      .then((planData) => {
        if (planData?.yesterday === undefined) {
          console.warn('No data received from Predbat API');

          return;
        }

        try {
          const validatedHistoricPlanData: RawData = PredbatRawDataSchema.parse(planData.yesterday);
          const validatedPlanData: RawData = PredbatRawDataSchema.parse(planData.plan);

          if (this._dataCallback === null) throw new Error('this._dataCallback is null');

          this._dataCallback(validatedHistoricPlanData, validatedPlanData);
        }
        catch (error) {
          console.error(error);
        }

        if (!this._isAvailable) {
          console.info('Successfully fetched Predbat API data');

          this._isAvailable = true;
          this._scheduleHalfHourUpdate(5);
        }
      })
      .catch((error) => {
        if (this._isAvailable) {
          console.warn('Predbat API request failed, will retry...', error.message);

          this._isAvailable = false;
          this._startPolling();
        }
        else {
          console.error(error);
        }
      })
      .finally(() => {
        this._fetchInProgress = false;
      });
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

    setTimeout(() => {
      this._fetchData();
      this._updateInterval = setInterval(() => {
        this._fetchData();
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

  public disconnect(): void {
    if (this._retryTimeout) {
      clearInterval(this._retryTimeout);
      this._retryTimeout = null;
    }
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
    this._isAvailable = false;
  }
}
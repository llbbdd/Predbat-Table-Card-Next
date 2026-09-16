import { PredbatData } from '../PredbatData';
import { RawData, PredbatRawDataSchema } from '../schemas/predbat';

export class PredbatService {
  private _dataCallback: ((predbatData: PredbatData) => void) | null;
  private _portRestApi: number;
  private _updateIntervalRestApi: ReturnType<typeof setInterval> | null = null;
  private _retryTimeoutRestApi: ReturnType<typeof setTimeout> | null = null;
  private _isAvailableRestApi = false;
  private _fetchInProgressRestApi = false;
  private _dataSource: 'REST_API' | 'HASS_STATES' | null = null;

  public constructor(port: number, dataCallback: (predbatData: PredbatData) => void) {
    this._portRestApi = port;
    this._dataCallback = dataCallback;

    this._getDataSource(port)
      .then((dataSource) => {
        this._dataSource = dataSource;

        if (this._dataSource === 'REST_API') this._startPollingRestApi();
      })
      .catch((error) => {
        throw error;
      });
  }

  private _startPollingRestApi(): void {
    this._fetchDataRestApi();

    this._retryTimeoutRestApi = setInterval(() => {
      if (!this._isAvailableRestApi && !this._fetchInProgressRestApi) {
        this._fetchDataRestApi();
      }
      else if (this._isAvailableRestApi) {
        if (this._retryTimeoutRestApi) {
          clearInterval(this._retryTimeoutRestApi);
          this._retryTimeoutRestApi = null;
        }
      }
    }, 1000);
  }

  private _fetchDataRestApi(): void {
    if (this._fetchInProgressRestApi) return;
    this._fetchInProgressRestApi = true;

    this._getPlanDataRestApi(this._portRestApi)
      .then((planData) => {
        if (planData?.yesterday === undefined) {
          console.warn('No data received from Predbat API');

          return;
        }

        try {
          const validatedHistoricPlanData: RawData = PredbatRawDataSchema.parse(planData.yesterday);
          const validatedPlanData: RawData = PredbatRawDataSchema.parse(planData.plan);

          if (this._dataCallback === null) throw new Error('this._dataCallback is null');

          this._dataCallback(new PredbatData(validatedHistoricPlanData, validatedPlanData));
        }
        catch (error) {
          console.error(error);
        }

        if (!this._isAvailableRestApi) {
          console.info('Successfully fetched Predbat API data');

          this._isAvailableRestApi = true;
          this._scheduleHalfHourUpdateRestApi(5);
        }
      })
      .catch((error) => {
        if (this._isAvailableRestApi) {
          console.warn('Predbat API request failed, will retry...', error.message);

          this._isAvailableRestApi = false;
          this._startPollingRestApi();
        }
        else {
          console.error('Predbat is unreachable');
        }
      })
      .finally(() => {
        this._fetchInProgressRestApi = false;
      });
  }

  private _scheduleHalfHourUpdateRestApi(updateIntervalMinutes: number): void {
    if (this._updateIntervalRestApi) {
      clearInterval(this._updateIntervalRestApi);
    }

    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinute = minutes < 30 ? 30 : 0;
    const nextHour = minutes < 30 ? now.getHours() : now.getHours() + 1;

    const nextUpdate = new Date(now);
    nextUpdate.setHours(nextHour, nextMinute, 0, 0);
    const delay = nextUpdate.getTime() - now.getTime() + 5000;

    setTimeout(() => {
      this._fetchDataRestApi();
      this._updateIntervalRestApi = setInterval(() => {
        this._fetchDataRestApi();
      }, updateIntervalMinutes * 60 * 1000);
    }, delay);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getPlanDataRestApi(port: number): Promise<any> {
    return fetch(`http://${window.location.hostname}:${port}/api/plan_data`)
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        throw new Error(error);
      });
  }

  private _getDataSource(port: number): Promise<'REST_API' | 'HASS_STATES'> {
    return fetch(`http://${window.location.hostname}:${port}/api/plan_data`)
      .then((response): 'REST_API' | 'HASS_STATES' => {
        console.info('Using REST API for Predbat data');

        if (response.ok) return 'REST_API';

        console.info('Using HASS state for Predbat data (response error)');

        return 'HASS_STATES';
      })
      .catch((): 'HASS_STATES' => {
        console.info('Using HASS state for Predbat data (fetch error)');

        return 'HASS_STATES';
      });
  }

  public disconnect(): void {
    if (this._retryTimeoutRestApi) {
      clearInterval(this._retryTimeoutRestApi);
      this._retryTimeoutRestApi = null;
    }

    if (this._updateIntervalRestApi) {
      clearInterval(this._updateIntervalRestApi);
      this._updateIntervalRestApi = null;
    }

    this._isAvailableRestApi = false;
  }
}
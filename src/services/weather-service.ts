import { Connection } from 'home-assistant-js-websocket';
import { Sun, TemperatureUnit, WeekdayKey } from '../types/home-assistant';
import { ForecastSubscriptionError } from '../utils/ForecastSubscriptionError';
import { maxWeatherSubscriptionRetries, weekdayMap, white } from '../constants';
import { getColourFromScale, invalidDay } from '../utils/general-utils';
import { WeatherAttributesSchema, WeatherForecastArray, WeatherForecastArraySchema, WeatherForecastItem } from '../schemas/weather';

export type WeatherRowData = {
  'weather-column': { value: string, colour: string } | null;
  'temp-column': { value: number, colour: string } | null;
  'rain-column': { value: number, colour: string } | null;
};

export class WeatherService {
  private _unsubscribeWeather: (() => Promise<void>) | null = null;
  private _connection: Connection | null = null;
  private _onUpdate: (() => void) | null = null;
  private _temperatureUnit: TemperatureUnit | null = null;
  private _forecast: WeatherForecastArray | null = null;
  private _sun: Sun | null = null;

  public getWeatherData(days: number): Map<string, WeatherRowData> | null {
    if (this._forecast === null) return null;

    const startIndex = 0;

    // Calculate hours from first entry to end of that day
    const firstItemDate = Temporal.PlainDateTime.from(this._forecast[0].datetime);
    const endOfDay = firstItemDate.with({ hour: 23, minute: 0, second: 0, millisecond: 0 });
    const hoursFirstDay = Math.round(Temporal.Duration.from(firstItemDate.until(endOfDay)).total('hours'));

    // Remaining days after the first day
    const totalHours = hoursFirstDay + ((days - 1) * 24);
    const endIndex = Math.min(startIndex + totalHours, this._forecast.length);
    const result = new Map<string, WeatherRowData>();

    for (let i = startIndex; i < endIndex; i++) {
      const tempUnit = this.temperatureUnit;

      const weatherColour = ((): string => {
        if (tempUnit === '°C') {
          return getColourFromScale(-10, 40, this._forecast[i].temperature.toFixed(1), 'redToBlue', true);
        }
        return getColourFromScale(14, 104, this._forecast[i].temperature.toFixed(1), 'redToBlue');
      })();

      result.set(this._forecast[i].datetime.toString(), {
        'weather-column': { value: this._forecast[i].condition, colour: white },
        'temp-column': { value: this._forecast[i].temperature, colour: weatherColour },
        'rain-column': { value: this._forecast[i].precipitation, colour: white }
      });
    }

    return result;
  }

  public async subscribe(weatherEntityId: string | undefined): Promise<void> {
    if (weatherEntityId === undefined) {
      console.info('No weather forecast entity configured');
    }
    else {
      // Prevent multiple subscription attempts
      if (this._unsubscribeWeather) return;

      // Exponential backoff because config can initialise before hass
      let attempts = 0;

      while (this._connection === null) {
        attempts++;

        const delayMs = attempts * 1000;

        if (attempts > maxWeatherSubscriptionRetries) {
          throw new Error('throw new Error(`Failed to subscribe to forecast - connection not available after ${maxWeatherSubscriptionRetries} attempts`);');
        }

        console.info(`Waiting for hass connection... attempt ${attempts}/${maxWeatherSubscriptionRetries} (waiting ${delayMs}ms)`);

        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Attempt weather subscription
      try {
        this._unsubscribeWeather = await this._connection.subscribeMessage(
          (event: { forecast: unknown[]; }) => {
            const validatedForecast = WeatherForecastArraySchema.parse(event.forecast);

            this._forecast = validatedForecast;

            if (this._onUpdate) this._onUpdate();
          },
          {
            type: 'weather/subscribe_forecast',
            entity_id: weatherEntityId,
            forecast_type: 'hourly'
          }
        );

        console.info('Weather forecast subscription successful');
      }
      catch (error) {
        const forecastSubscriptionError = error as ForecastSubscriptionError;

        if (forecastSubscriptionError.code !== 'invalid_format') {
          console.error('Failed to subscribe to forecast:', forecastSubscriptionError);
        }

        throw new Error('Failed to subscribe to forecast - Correct the entity value and refresh');
      }
    }
  }

  public get subscribed(): boolean {
    return this._forecast !== null;
  }

  public get temperatureUnit(): TemperatureUnit {
    if (this._temperatureUnit === null) throw new Error('this._temperatureUnit is null');

    return this._temperatureUnit;
  }

  public set onUpdate(callback: () => void) {
    this._onUpdate = callback;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public set temperatureUnit(weatherAttributes: any) {
    try {
      const validated = WeatherAttributesSchema.parse(weatherAttributes);

      this._temperatureUnit = validated.temperature_unit;
    }
    catch {
      this._temperatureUnit = '°C';
    }
  }

  public set sun(sun: Sun) {
    this._sun = sun;
  }

  public get nextRising(): Date {
    if (this._sun === null) throw new Error('this._sun is null');

    return new Date(this._sun.attributes.next_rising);
  }

  public get nextSetting(): Date {
    if (this._sun === null) throw new Error('this._sun is null');

    return new Date(this._sun.attributes.next_setting);
  }

  public async unsubscribe(): Promise<void> {
    if (this._unsubscribeWeather !== null) {
      await this._unsubscribeWeather();
      this._unsubscribeWeather = null;
    }
  }

  public set connection(connection: Connection) {
    this._connection = connection;
  }

  // Note: the forecast data only starts at the current half hour, not the start of the day
  public _findForecastForLabel(label: string, forecastArray: WeatherForecastArray): WeatherForecastItem | null {
    if (!label || !forecastArray.length) {
      return null;
    }

    const [labelDayStr, labelTimeStr] = label.split(' ');

    const [labelHour] = labelTimeStr.split(':').map(Number);

    if (invalidDay(labelDayStr)) throw new Error('Invalid weekday');

    const targetWeekday = weekdayMap[labelDayStr as WeekdayKey];
    const now = new Date();
    const todayWeekday = now.getDay();
    const dayOffset = (targetWeekday - todayWeekday + 7) % 7;

    // Create label Date (local time), but round down to the hour
    const labelDate = new Date(now);
    labelDate.setDate(now.getDate() + dayOffset);
    labelDate.setHours(labelHour, 0, 0, 0); // zero minutes/seconds

    const labelHourTime = labelDate.getTime();

    // Try to find forecast that exactly matches this hour (local time)
    for (const forecast of forecastArray) {
      const forecastDate = new Date(forecast.datetime); // UTC -> local
      if (forecastDate.getTime() === labelHourTime) {
        return forecast;
      }
    }

    return null;
  }

  public isLabelDuringNight(label: string): boolean {
    const parts = label.split(' ');

    if (parts.length !== 2) {
      throw new Error(`Invalid label format: ${label}. Expected format: "Day HH:mm"`);
    }

    const [, time] = parts;
    const [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time: ${time}. Expected format: "HH:mm"`);
    }

    const labelMinutes = hours * 60 + minutes;

    const sunrise = new Date(this.nextRising);
    const sunset = new Date(this.nextSetting);

    const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
    const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();

    return labelMinutes < sunriseMinutes || labelMinutes >= sunsetMinutes;
  }
}
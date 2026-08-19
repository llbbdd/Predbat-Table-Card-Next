export class ForecastSubscriptionError extends Error {
  public constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ForecastSubscriptionError';
  }
}

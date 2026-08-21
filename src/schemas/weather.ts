import { z } from 'zod';

export const WeatherConditionSchema = z.enum([
  'cloudy',
  'partlycloudy',
  'clear-night',
  'sunny',
  'rainy',
  'snowy',
  'windy',
  'fog',
  'exceptional',
  'hail',
  'lightning',
  'lightning-rainy',
  'pouring',
  'snowy-rainy',
  'windy-variant'
]);

export const WeatherForecastItemSchema = z.object({
  condition: WeatherConditionSchema,
  datetime: z.string().transform((str) => {
    const date = new Date(str);
    // Return as YYYY-MM-DDTHH:MM:SS (no timezone, no milliseconds)
    return date.toISOString().replace(/\.\d{3}Z$/, '').replace(/Z$/, '');
  }),
  //wind_bearing: z.number(),
  //cloud_coverage: z.number(),
  //uv_index: z.number(),
  temperature: z.number(),
  //wind_speed: z.number(),
  precipitation: z.number()
  //humidity: z.number()
});

export const WeatherForecastArraySchema = z.array(WeatherForecastItemSchema);

export type WeatherForecastItem = z.infer<typeof WeatherForecastItemSchema>;
export type WeatherForecastArray = z.infer<typeof WeatherForecastArraySchema>;

export const WeatherAttributesSchema = z.object({
  friendly_name: z.string(),
  temperature_unit: z.enum(['°C', '°F'])
});
export type WeatherAttributes = z.infer<typeof WeatherAttributesSchema>;
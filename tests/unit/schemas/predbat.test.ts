import { PredbatImportRatesSchema } from '../../../src/schemas/predbat';

describe('PredbatImportRatesSchema', () => {
  it('should return null results when exactly 2 entries', () => {
    const data = {
      entity_id: 'predbat.rates',
      attributes: {
        results: {
          '2026-07-19T00:00:00+0100': 0,
          '2026-07-23T12:30:00+0100': 0
        }
      },
      last_updated: '2026-07-18T07:05:10.335Z'
    };

    const result = PredbatImportRatesSchema.parse(data);
    expect(result.results).toBeNull();
  });
});
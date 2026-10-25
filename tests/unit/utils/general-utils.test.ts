import { describe, it, expect } from '@jest/globals';
import { cleanAndValidateVersion, convertTimeStampToFriendly } from '../../../src/utils/general-utils';
import { RawData } from '../../../src/schemas/predbat';

describe('general-utils', () => {
  describe('convertTimeStampToFriendly', () => {
    describe('Valid timestamps', () => {
      it.each([
        ['2024-01-15T09:00:00Z', 'Mon 09:00'],
        ['2024-01-15T09:00:00+00:00', 'Mon 09:00'],
        ['2024-01-15T09:00:00-01:00', 'Mon 10:00'],
        ['2024-01-15T14:30:00+01:00', 'Mon 13:30'],
        ['2024-01-16T00:00:00Z', 'Tue 00:00'],
        ['2024-01-17T23:59:00Z', 'Wed 23:59']
      ])('should convert "%s" to "%s"', (input, expected) => {
        expect(convertTimeStampToFriendly(input)).toBe(expected);
      });
    });

    describe('Invalid inputs (should throw)', () => {
      it.each([
        ['', 'Invalid date string: '],
        ['invalid', 'Invalid date string: invalid'],
        ['not-a-date', 'Invalid date string: not-a-date']
      ])('should throw error for "%s" with message "%s"', (input, expectedMessage) => {
        expect(() => convertTimeStampToFriendly(input)).toThrow(expectedMessage);
      });
    });

    describe('Timezone colon fix', () => {
      it.each([
        ['2024-01-15T09:00:00+0000', 'Mon 09:00'],
        ['2024-01-15T09:00:00-0000', 'Mon 09:00']
      ])('should fix timezone "%s" to "%s"', (input, expected) => {
        expect(convertTimeStampToFriendly(input)).toBe(expected);
      });
    });
  });

  describe('convertTimeStampToFriendly - Integration with getArrayDataFromRaw', () => {
    it('should format time column correctly', () => {
      const rawData: RawData = {
        rows: [
          {
            time: '2024-01-15T09:00:00+00:00',
            pv_forecast: 0.5,
            soc_percent: 80,
            load_forecast: 0.3,
            state: 'Chrg',
            cost_change: 0.05,
            soc_change: 2,
            import_rate: 0.15,
            export_rate: 0.10,
            state_target: 85,
            pv_color: '#ffffff',
            soc_color: '#ffffff',
            load_color: '#ffffff',
            state_color: '#ffffff',
            soc_sym: '&searr;',
            slot_minute: 0,
            import_rate_adjusted: 0,
            export_rate_adjusted: 0,
            state_override: '',
            state_html: '',
            state_text: '',
            state2_text: null,
            state2_color: null,
            show_limit: '',
            pv_forecast10: 0,
            pv_forecast_total: 0,
            load_forecast10: 0,
            load_forecast_total: 0,
            clipped: 0,
            rate_color_import: '',
            rate_color_export: '',
            cost_color: '',
            clipped_color: '',
            extra_load: 0,
            extra_load_total: 0,
            extra_color: '',
            rowspan_state: 0,
            skip_state_cell: false,
            rowspan_limit: 0,
            skip_limit_cell: false,
            split: false
          }
        ],
        import_cost_threshold: 0,
        export_cost_threshold: 0,
        currency_symbols: ['£', 'p'],
        soc: 0,
        soc_max: 0,
        reserve: 0,
        time: '',
        mode: '',
        plan_debug: false,
        forecast_minutes: 0,
        end_record: 0,
        end_plan: 0,
        num_cars: 0,
        iboost_enable: false,
        carbon_enable: false,
        manual_load_value: 0,
        totals: {
          pv_forecast: 0,
          load_forecast: 0,
          clipped: 0,
          extra_load: 0,
          soc_percent: 0
        },
        timestamp: ''
      };

      // This simulates the usage in _getArrayDataFromRaw
      const row = rawData.rows[0];
      const timeValue = convertTimeStampToFriendly(row.time);

      expect(timeValue).toBe('Mon 09:00');
    });

    it('should handle multiple rows with different times', () => {
      const rawData: RawData = {
        rows: [
          {
            time: '2024-01-15T09:00:00+00:00', pv_forecast: 0.5, soc_percent: 80, load_forecast: 0.3, state: 'Chrg', cost_change: 0.05, soc_change: 2, import_rate: 0.15, export_rate: 0.10, state_target: 85,
            pv_color: '#ffffff',
            soc_color: '#ffffff',
            load_color: '#ffffff',
            state_color: '#ffffff',
            soc_sym: '&searr;',
            slot_minute: 0,
            import_rate_adjusted: 0,
            export_rate_adjusted: 0,
            state_override: '',
            state_html: '',
            state_text: '',
            state2_text: null,
            state2_color: null,
            show_limit: '',
            pv_forecast10: 0,
            pv_forecast_total: 0,
            load_forecast10: 0,
            load_forecast_total: 0,
            clipped: 0,
            rate_color_import: '',
            rate_color_export: '',
            cost_color: '',
            clipped_color: '',
            extra_load: 0,
            extra_load_total: 0,
            extra_color: '',
            rowspan_state: 0,
            skip_state_cell: false,
            rowspan_limit: 0,
            skip_limit_cell: false,
            split: false
          },
          {
            time: '2024-01-15T10:00:00+00:00', pv_forecast: 0.6, soc_percent: 82, load_forecast: 0.4, state: 'Chrg', cost_change: 0.06, soc_change: 2, import_rate: 0.15, export_rate: 0.10, state_target: 85,
            pv_color: '#ffffff',
            soc_color: '#ffffff',
            load_color: '#ffffff',
            state_color: '#ffffff',
            soc_sym: '&searr;',
            slot_minute: 0,
            import_rate_adjusted: 0,
            export_rate_adjusted: 0,
            state_override: '',
            state_html: '',
            state_text: '',
            state2_text: null,
            state2_color: null,
            show_limit: '',
            pv_forecast10: 0,
            pv_forecast_total: 0,
            load_forecast10: 0,
            load_forecast_total: 0,
            clipped: 0,
            rate_color_import: '',
            rate_color_export: '',
            cost_color: '',
            clipped_color: '',
            extra_load: 0,
            extra_load_total: 0,
            extra_color: '',
            rowspan_state: 0,
            skip_state_cell: false,
            rowspan_limit: 0,
            skip_limit_cell: false,
            split: false
          },
          {
            time: '2024-01-15T11:00:00+00:00', pv_forecast: 0.7, soc_percent: 84, load_forecast: 0.5, state: 'Chrg', cost_change: 0.07, soc_change: 2, import_rate: 0.15, export_rate: 0.10, state_target: 85,
            pv_color: '#ffffff',
            soc_color: '#ffffff',
            load_color: '#ffffff',
            state_color: '#ffffff',
            soc_sym: '&searr;',
            slot_minute: 0,
            import_rate_adjusted: 0,
            export_rate_adjusted: 0,
            state_override: '',
            state_html: '',
            state_text: '',
            state2_text: null,
            state2_color: null,
            show_limit: '',
            pv_forecast10: 0,
            pv_forecast_total: 0,
            load_forecast10: 0,
            load_forecast_total: 0,
            clipped: 0,
            rate_color_import: '',
            rate_color_export: '',
            cost_color: '',
            clipped_color: '',
            extra_load: 0,
            extra_load_total: 0,
            extra_color: '',
            rowspan_state: 0,
            skip_state_cell: false,
            rowspan_limit: 0,
            skip_limit_cell: false,
            split: false
          }
        ],
        import_cost_threshold: 0,
        export_cost_threshold: 0,
        currency_symbols: ['£', 'p'],
        soc: 0,
        soc_max: 0,
        reserve: 0,
        time: '',
        mode: '',
        plan_debug: false,
        forecast_minutes: 0,
        end_record: 0,
        end_plan: 0,
        num_cars: 0,
        iboost_enable: false,
        carbon_enable: false,
        manual_load_value: 0,
        totals: {
          pv_forecast: 0,
          load_forecast: 0,
          clipped: 0,
          extra_load: 0,
          soc_percent: 0
        },
        timestamp: ''
      };

      const expectedTimes = ['Mon 09:00', 'Mon 10:00', 'Mon 11:00'];

      rawData.rows.forEach((row, index) => {
        const timeValue = convertTimeStampToFriendly(row.time);
        expect(timeValue).toBe(expectedTimes[index]);
      });
    });
  });

  describe('cleanAndValidateVersion', () => {
    describe('Valid versions', () => {
      it.each([
        ['v1.0.0', '1.0.0'],
        ['v1.2.3', '1.2.3'],
        ['v2.0.0', '2.0.0'],
        ['v10.0.0', '10.0.0'],
        ['v1.2.3-alpha', '1.2.3-alpha'],
        ['v1.2.3-beta.1', '1.2.3-beta.1'],
        ['v1.2.3+20130313144700', '1.2.3'],
        ['v1.2.3-alpha+001', '1.2.3-alpha'],
        ['1.0.0', '1.0.0'],
        ['1.2.3', '1.2.3'],
        ['2.0.0', '2.0.0'],
        ['10.0.0', '10.0.0'],
        ['1.2.3-alpha', '1.2.3-alpha'],
        ['1.0.0-alpha.1.2', '1.0.0-alpha.1.2']
      ])('should clean and validate "%s" to "%s"', (input, expected) => {
        expect(cleanAndValidateVersion(input)).toBe(expected);
      });
    });

    describe('Invalid versions', () => {
      it.each([
        ['invalid'],
        ['v'],
        ['1.'],
        ['.1'],
        ['1..2'],
        ['1.0'],
        ['v1.0'],
        ['1.0.0.0'],
        ['v1.0.0.0'],
        ['1.0.0+'],
        ['1.0.0+001+002'],
        ['abc'],
        ['vabc'],
        ['1.2.3.4.5'],
        ['v1.2.3.4.5']
      ])('should return null', (input) => {
        const result = cleanAndValidateVersion(input);

        expect(result).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should return null for undefined', () => {
        expect(cleanAndValidateVersion(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(cleanAndValidateVersion('')).toBeNull();
      });

      it('should strip build metadata', () => {
        expect(cleanAndValidateVersion('1.0.0+20230101')).toBe('1.0.0');
        expect(cleanAndValidateVersion('v1.0.0+20230101')).toBe('1.0.0');
      });

      it('should handle pre-release versions', () => {
        expect(cleanAndValidateVersion('1.0.0-rc.1')).toBe('1.0.0-rc.1');
        expect(cleanAndValidateVersion('v1.0.0-rc.1')).toBe('1.0.0-rc.1');
        expect(cleanAndValidateVersion('1.0.0-alpha.1')).toBe('1.0.0-alpha.1');
        expect(cleanAndValidateVersion('v1.0.0-alpha.1')).toBe('1.0.0-alpha.1');
      });

      it('should handle versions with leading/trailing spaces', () => {
        expect(cleanAndValidateVersion(' 1.0.0 ')).toBe('1.0.0');
        expect(cleanAndValidateVersion(' v1.0.0 ')).toBe('1.0.0');
      });
    });

    describe('Predbat real-world examples', () => {
      it.each([
        ['v8.29.7', '8.29.7'],
        ['v8.28.0', '8.28.0'],
        ['v8.30.0', '8.30.0'],
        ['v9.0.0', '9.0.0'],
        ['8.29.7', '8.29.7'],
        ['8.28.0', '8.28.0']
      ])('should handle Predbat version "%s" correctly', (input, expected) => {
        expect(cleanAndValidateVersion(input)).toBe(expected);
      });

      it('should return null for invalid Predbat-like versions', () => {
        expect(cleanAndValidateVersion('v8.29')).toBeNull();
        expect(cleanAndValidateVersion('v8.29.7.0')).toBeNull();
        expect(cleanAndValidateVersion('8.29')).toBeNull();
      });
    });

    describe('isSemver validation', () => {
      it('should validate proper semver versions', () => {
        const result = cleanAndValidateVersion('1.0.0');
        expect(result).toBe('1.0.0');
      });

      it('should reject invalid semver versions', () => {
        const result = cleanAndValidateVersion('not-a-version');
        expect(result).toBeNull();
      });

      it('should reject versions with invalid pre-release format', () => {
        expect(cleanAndValidateVersion('1.0.0-alpha..1')).toBeNull();
      });
    });
  });
});
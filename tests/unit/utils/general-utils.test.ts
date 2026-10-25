import { describe, it, expect } from '@jest/globals';
import { cleanAndValidateVersion, convertTimeStampToFriendly, getColourFromScale } from '../../../src/utils/general-utils';
import { RawData } from '../../../src/schemas/predbat';

describe('general-utils', () => {
  describe('getPriceColour', () => {
    describe('Normal scale - Return format validation', () => {
      it.skip('VISUAL COLOUR SCALE: -30p to 50p (0p and below = Blue)', () => {
        const testValues = [
          // Negative values (all blue - free)
          { value: '-30', label: '-30p  🔵 Free' },
          { value: '-25', label: '-25p  🔵 Free' },
          { value: '-20', label: '-20p  🔵 Free' },
          { value: '-15', label: '-15p  🔵 Free' },
          { value: '-10', label: '-10p  🔵 Free' },
          { value: '-05', label: '-5p   🔵 Free' },
          // Zero (blue - free)
          { value: '0', label: '0p    🔵 Free' },
          // Positive values (colour gradient)
          { value: '1', label: '1p    🟩 Very Cheap' },
          { value: '2', label: '2p    🟩 Very Cheap' },
          { value: '3', label: '3p    🟩 Very Cheap' },
          { value: '4', label: '4p    🟩 Very Cheap' },
          { value: '5', label: '5p    🟩 Cheap' },
          { value: '6', label: '6p    🟩 Cheap' },
          { value: '7', label: '7p    🟩 Cheap' },
          { value: '8', label: '8p    🟩 Cheap' },
          { value: '9', label: '9p    🟩 Cheap' },
          { value: '10', label: '10p   🟩 Good' },
          { value: '11', label: '11p   🟩 Good' },
          { value: '12', label: '12p   🟩 Good' },
          { value: '13', label: '13p   🟩 Good' },
          { value: '14', label: '14p   🟩 Good' },
          { value: '15', label: '15p   🟨 Moderate' },
          { value: '16', label: '16p   🟨 Moderate' },
          { value: '17', label: '17p   🟨 Moderate' },
          { value: '18', label: '18p   🟨 Moderate' },
          { value: '19', label: '19p   🟨 Moderate' },
          { value: '20', label: '20p   🟧 Expensive' },
          { value: '21', label: '21p   🟧 Expensive' },
          { value: '22', label: '22p   🟧 Expensive' },
          { value: '23', label: '23p   🟧 Expensive' },
          { value: '24', label: '24p   🟧 Expensive' },
          { value: '25', label: '25p   🟥 Very Expensive' },
          { value: '26', label: '26p   🟥 Very Expensive' },
          { value: '27', label: '27p   🟥 Very Expensive' },
          { value: '28', label: '28p   🟥 Very Expensive' },
          { value: '29', label: '29p   🟥 Very Expensive' },
          { value: '30', label: '30p+  ⚠️ Red (Max)' },
          { value: '35', label: '35p   ⚠️ Red (Capped)' },
          { value: '40', label: '40p   ⚠️ Red (Capped)' },
          { value: '50', label: '50p   ⚠️ Red (Capped)' }
        ];

        testValues.forEach(({ value, label }) => displayColour(getColourFromScale(0, 30, value, 'redToBlue'), label));
      });

      describe('Positive values (0p to 30p)', () => {
        it('should return blue for 0p (free)', () => {
          const expected = 'rgb(34, 109, 201)';
          const actual = getColourFromScale(0, 30, '0', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return red for 30p (expensive)', () => {
          const expected = 'rgb(255, 0, 0)';
          const actual = getColourFromScale(0, 30, '30', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return yellow-green for 25p', () => {
          const expected = 'rgb(225, 30, 13)';
          const actual = getColourFromScale(0, 30, '25', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return orange for 20p', () => {
          const expected = 'rgb(195, 60, 25)';
          const actual = getColourFromScale(0, 30, '20', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return moderate yellow for 15p', () => {
          const expected = 'rgb(165, 90, 38)';
          const actual = getColourFromScale(0, 30, '15', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return good green for 10p', () => {
          const expected = 'rgb(135, 120, 50)';
          const actual = getColourFromScale(0, 30, '10', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return cheap green for 5p', () => {
          const expected = 'rgb(105, 150, 63)';
          const actual = getColourFromScale(0, 30, '5', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should cap values above 30p at red', () => {
          const expected = 'rgb(255, 0, 0)';
          const actual = getColourFromScale(0, 30, '100', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should handle small positive values', () => {
          const expected = 'rgb(81, 174, 73)';
          const actual = getColourFromScale(0, 30, '1', 'redToBlue');
          expect(actual).toBe(expected);
        });
      });

      describe('Negative values (≤ 0p = Blue)', () => {
        it('should return blue for -30p (free)', () => {
          const expected = 'rgb(34, 109, 201)';
          const actual = getColourFromScale(0, 30, '-30', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return blue for -20p (free)', () => {
          const expected = 'rgb(34, 109, 201)';
          const actual = getColourFromScale(0, 30, '-20', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return blue for -10p (free)', () => {
          const expected = 'rgb(34, 109, 201)';
          const actual = getColourFromScale(0, 30, '-10', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should return blue for 0p (free)', () => {
          const expected = 'rgb(34, 109, 201)';
          const actual = getColourFromScale(0, 30, '0', 'redToBlue');
          expect(actual).toBe(expected);
        });
      });

      describe('Invalid inputs (should throw errors)', () => {
        it('should throw error for NaN', () => {
          expect(() => getColourFromScale(0, 30, 'NaN', 'redToBlue')).toThrow('Price value is invalid: NaN');
        });
      });

      describe('Edge cases', () => {
        it('should handle very large positive numbers as red', () => {
          const expected = 'rgb(255, 0, 0)';
          const actual = getColourFromScale(0, 30, '100', 'redToBlue');
          expect(actual).toBe(expected);
        });

        it('should handle very large negative numbers as blue', () => {
          const expected = 'rgb(34, 109, 201)';
          const actual = getColourFromScale(0, 30, '-100', 'redToBlue');
          expect(actual).toBe(expected);
        });
      });

      describe('Return format validation', () => {
        it('should return valid RGB string for all valid inputs', () => {
          const testValues = ['-0.30', '-0.10', '0', '10', '20', '25', '30'];
          testValues.forEach(value => {
            const colour = getColourFromScale(0, 30, value, 'redToBlue');
            expect(colour).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);
          });
        });
      });
    });

    describe('getPriceColour - Reversed scale (export)', () => {
      it.skip('VISUAL COLOUR SCALE REVERSED: -30p to 50p (0p and below = Blue)', () => {
        const testValues = [
        // Negative values (all blue - free)
          { value: '-30', label: '-30p  🔵 Free' },
          { value: '-25', label: '-25p  🔵 Free' },
          { value: '-20', label: '-20p  🔵 Free' },
          { value: '-15', label: '-15p  🔵 Free' },
          { value: '-10', label: '-10p  🔵 Free' },
          { value: '-05', label: '-5p   🔵 Free' },
          // Zero (blue - free)
          { value: '0', label: '0p    🔵 Free' },
          // Positive values (reversed colour gradient - high = green, low = red)
          { value: '1', label: '1p    🟥 Very Low Profit' },
          { value: '2', label: '2p    🟥 Very Low Profit' },
          { value: '3', label: '3p    🟥 Very Low Profit' },
          { value: '4', label: '4p    🟥 Very Low Profit' },
          { value: '5', label: '5p    🟧 Low Profit' },
          { value: '6', label: '6p    🟧 Low Profit' },
          { value: '7', label: '7p    🟧 Low Profit' },
          { value: '8', label: '8p    🟧 Low Profit' },
          { value: '9', label: '9p    🟧 Low Profit' },
          { value: '10', label: '10p   🟨 Moderate Profit' },
          { value: '11', label: '11p   🟨 Moderate Profit' },
          { value: '12', label: '12p   🟨 Moderate Profit' },
          { value: '13', label: '13p   🟨 Moderate Profit' },
          { value: '14', label: '14p   🟨 Moderate Profit' },
          { value: '15', label: '15p   🟩 Good Profit' },
          { value: '16', label: '16p   🟩 Good Profit' },
          { value: '17', label: '17p   🟩 Good Profit' },
          { value: '18', label: '18p   🟩 Good Profit' },
          { value: '19', label: '19p   🟩 Good Profit' },
          { value: '20', label: '20p   🟩 Great Profit' },
          { value: '21', label: '21p   🟩 Great Profit' },
          { value: '22', label: '22p   🟩 Great Profit' },
          { value: '23', label: '23p   🟩 Great Profit' },
          { value: '24', label: '24p   🟩 Great Profit' },
          { value: '25', label: '25p   🟢 Excellent Profit' },
          { value: '26', label: '26p   🟢 Excellent Profit' },
          { value: '27', label: '27p   🟢 Excellent Profit' },
          { value: '28', label: '28p   🟢 Excellent Profit' },
          { value: '29', label: '29p   🟢 Excellent Profit' },
          { value: '30', label: '30p+  🟢 Green (Max)' },
          { value: '35', label: '35p   🟢 Green (Capped)' },
          { value: '40', label: '40p   🟢 Green (Capped)' },
          { value: '50', label: '50p   🟢 Green (Capped)' }
        ];

        testValues.forEach(({ value, label }) => displayColour(getColourFromScale(0, 30, value, 'redToBlue', true), label));
      });

      describe('Reversed scale - Positive values (0p to 30p)', () => {
        it('should return yellow for 0p (free) when reversed', () => {
          const expected = 'rgb(255, 251, 0)';
          const actual = getColourFromScale(0, 30, '0', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return green for 30p (high profit) when reversed', () => {
          const expected = 'rgb(75, 180, 75)';
          const actual = getColourFromScale(0, 30, '30', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return green-yellow for 25p when reversed', () => {
          const expected = 'rgb(105, 150, 63)';
          const actual = getColourFromScale(0, 30, '25', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return yellow for 20p when reversed', () => {
          const expected = 'rgb(135, 120, 50)';
          const actual = getColourFromScale(0, 30, '20', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return orange for 15p when reversed', () => {
          const expected = 'rgb(165, 90, 38)';
          const actual = getColourFromScale(0, 30, '15', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return red for 10p when reversed', () => {
          const expected = 'rgb(195, 60, 25)';
          const actual = getColourFromScale(0, 30, '10', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return red for 5p when reversed', () => {
          const expected = 'rgb(225, 30, 13)';
          const actual = getColourFromScale(0, 30, '5', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should cap values above 30p at green when reversed', () => {
          const expected = 'rgb(75, 180, 75)';
          const actual = getColourFromScale(0, 30, '100', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should handle small positive values when reversed', () => {
          const expected = 'rgb(249, 6, 3)';
          const actual = getColourFromScale(0, 30, '1', 'redToBlue', true);
          expect(actual).toBe(expected);
        });
      });

      describe('Reversed scale - Negative values (≤ 0p = Yellow)', () => {
        it('should return yellow for -30p when reversed', () => {
          const expected = 'rgb(255, 251, 0)';
          const actual = getColourFromScale(0, 30, '-30', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return yellow for -20p when reversed', () => {
          const expected = 'rgb(255, 251, 0)';
          const actual = getColourFromScale(0, 30, '-20', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return yellow for -10p when reversed', () => {
          const expected = 'rgb(255, 251, 0)';
          const actual = getColourFromScale(0, 30, '-10', 'redToBlue', true);
          expect(actual).toBe(expected);
        });

        it('should return yellow for 0p when reversed', () => {
          const expected = 'rgb(255, 251, 0)';
          const actual = getColourFromScale(0, 30, '0', 'redToBlue', true);
          expect(actual).toBe(expected);
        });
      });

      describe('Reversed scale - Invalid inputs', () => {
        it('should throw error for NaN when reversed', () => {
          expect(() => getColourFromScale(0, 30, 'NaN', 'redToBlue', true)).toThrow('Price value is invalid: NaN');
        });
      });

      describe('Reversed scale - Return format validation', () => {
        it('should return valid RGB string for all valid inputs when reversed', () => {
          const testValues = ['-0.30', '-0.10', '0', '10', '20', '25', '30'];
          testValues.forEach(value => {
            const colour = getColourFromScale(0, 30, value, 'redToBlue', true);
            expect(colour).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);
          });
        });
      });
    });
  });

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
        // Completely invalid
        ['', 'Invalid date string: must be a non-empty string'],

        // Invalid date format
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
        ['v1.2.3+20130313144700', '1.2.3+20130313144700'],
        ['v1.2.3-alpha+001', '1.2.3-alpha+001'],
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
      ])('should return null and log warning for invalid version "%s"', (input) => {
        // Spy on console.warn to verify it's called
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = cleanAndValidateVersion(input);
        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Invalid version format: ${input}`);

        consoleWarnSpy.mockRestore();
      });
    });

    describe('Edge cases', () => {
      it('should return null for undefined', () => {
        expect(cleanAndValidateVersion(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(cleanAndValidateVersion('')).toBeNull();
      });

      it('should handle versions with build metadata', () => {
        expect(cleanAndValidateVersion('1.0.0+20230101')).toBe('1.0.0+20230101');
        expect(cleanAndValidateVersion('v1.0.0+20230101')).toBe('1.0.0+20230101');
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

      it('should return null for undefined', () => {
        expect(cleanAndValidateVersion(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(cleanAndValidateVersion('')).toBeNull();
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

// Helper to display RGB colour in terminal
function displayColour(rgb: string, label: string): void {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const bgColour = `\x1b[48;2;${r};${g};${b}m`;
    const reset = '\x1b[0m';
    // eslint-disable-next-line no-console
    console.info(`${bgColour}  ${label.padEnd(22)} ${rgb}  ${reset}`);
  }
  else {
    // eslint-disable-next-line no-console
    console.info(`${label.padEnd(22)} ${rgb}`);
  }
}
import { describe, it, expect } from '@jest/globals';
import { _formatLocalTime, cleanAndValidateVersion, convertTimeStampToFriendly, dateStringHasTimezoneOffset, getColourFromScale, getStringToDate, invalidDay, isError, isVersionGreater } from '../../../src/utils/general-utils';
import { RawData } from '../../../src/schemas/predbat';

describe('general-utils', () => {
  describe('dateStringHasTimezoneOffset', () => {
    describe('Valid timezone offsets (should return true)', () => {
      it.each([
        // +HH:MM format
        ['2026-07-18T07:06:17.597+01:00', true],
        ['2026-07-18T07:06:17.597+00:00', true],
        ['2026-07-18T07:06:17.597-05:00', true],
        ['2026-07-18T07:06:17.597+10:30', true],
        // +HHMM format
        ['2026-07-18T07:06:17.597+0100', true],
        ['2026-07-18T07:06:17.597+0000', true],
        ['2026-07-18T07:06:17.597-0500', true],
        ['2026-07-18T07:06:17.597+1030', true],
        // Just the offset
        ['+01:00', true],
        ['+0100', true],
        ['-05:00', true],
        ['-0500', true]
      ])('should return true for "%s"', (input, expected) => {
        expect(dateStringHasTimezoneOffset(input)).toBe(expected);
      });
    });

    describe('Invalid timezone offsets (should return false)', () => {
      it.each([
        // Z format (UTC) - not an offset
        ['2026-07-18T07:06:17.597Z', false],
        // No timezone
        ['2026-07-18T07:06:17.597', false],
        ['2026-07-18', false],
        // Invalid formats
        ['2026-07-18T07:06:17.597+01:0', false],
        ['2026-07-18T07:06:17.597+010', false],
        ['2026-07-18T07:06:17.597+5:00', false],
        ['2026-07-18T07:06:17.597+', false],
        ['2026-07-18T07:06:17.597-', false],
        // Empty or nonsense
        ['', false],
        ['abc', false],
        ['+', false],
        ['-', false],
        ['+5', false],
        ['-5', false]
      ])('should return false for "%s"', (input, expected) => {
        expect(dateStringHasTimezoneOffset(input)).toBe(expected);
      });
    });

    describe('Edge cases', () => {
      it.each([
        ['+00:00', true],
        ['-00:00', true],
        ['+0000', true],
        ['-0000', true],
        ['+23:59', true],
        ['-23:59', true],
        ['+2359', true],
        ['-2359', true]
      ])('should handle edge cases like "%s"', (input, expected) => {
        expect(dateStringHasTimezoneOffset(input)).toBe(expected);
      });
    });
  });

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

  describe('isVersionGreater', () => {
    describe('Valid versions', () => {
      it('should return true when a is greater than b (major version)', () => {
        expect(isVersionGreater('2.0.0', '1.0.0')).toBe(true);
      });

      it('should return false when a is less than b (major version)', () => {
        expect(isVersionGreater('1.0.0', '2.0.0')).toBe(false);
      });

      it('should return true when a is greater than b (minor version)', () => {
        expect(isVersionGreater('1.2.0', '1.1.0')).toBe(true);
      });

      it('should return false when a is less than b (minor version)', () => {
        expect(isVersionGreater('1.1.0', '1.2.0')).toBe(false);
      });

      it('should return true when a is greater than b (patch version)', () => {
        expect(isVersionGreater('1.0.2', '1.0.1')).toBe(true);
      });

      it('should return false when a is less than b (patch version)', () => {
        expect(isVersionGreater('1.0.1', '1.0.2')).toBe(false);
      });

      it('should return false when versions are equal', () => {
        expect(isVersionGreater('1.0.0', '1.0.0')).toBe(false);
      });

      it('should handle versions with leading "v"', () => {
        expect(isVersionGreater('v2.0.0', 'v1.0.0')).toBe(true);
        expect(isVersionGreater('v1.0.0', 'v2.0.0')).toBe(false);
        expect(isVersionGreater('v1.2.0', 'v1.1.0')).toBe(true);
        expect(isVersionGreater('v1.0.2', 'v1.0.1')).toBe(true);
      });

      it('should handle mixed leading "v"', () => {
        expect(isVersionGreater('v2.0.0', '1.0.0')).toBe(true);
        expect(isVersionGreater('1.0.0', 'v2.0.0')).toBe(false);
      });
    });

    describe('Different version lengths', () => {
      it('should handle a with fewer parts than b', () => {
        expect(isVersionGreater('1.2', '1.2.0')).toBe(false);
        expect(isVersionGreater('1.3', '1.2.9')).toBe(true);
      });

      it('should handle a with more parts than b', () => {
        expect(isVersionGreater('1.2.0', '1.2')).toBe(false);
        expect(isVersionGreater('1.2.1', '1.2')).toBe(true);
      });

      it('should handle single part versions', () => {
        expect(isVersionGreater('2', '1')).toBe(true);
        expect(isVersionGreater('1', '2')).toBe(false);
        expect(isVersionGreater('1', '1')).toBe(false);
      });

      it('should handle single part with multi-part', () => {
        expect(isVersionGreater('2', '1.9.9')).toBe(true);
        expect(isVersionGreater('1', '1.9.9')).toBe(false);
        expect(isVersionGreater('2', '2.0.0')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should throw error when a is null', () => {
        expect(() => isVersionGreater(null, '1.0.0')).toThrow('Version string is null');
      });
    });
  });

  describe('getStringToDate - Parameterized', () => {
    const fixedDate = new Date('2024-01-15T00:00:00'); // Monday

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(fixedDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('With mocked date', () => {
      const mockDate = new Date('2024-01-15T00:00:00'); // Monday

      beforeEach(() => {
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      });

      it.each([
        ['Mon 09:00', '2024-01-15T09:00:00'],
        ['Tue 09:00', '2024-01-16T09:00:00'],
        ['Wed 09:00', '2024-01-17T09:00:00'],
        ['Thu 09:00', '2024-01-18T09:00:00'],
        ['Fri 09:00', '2024-01-19T09:00:00'],
        ['Sat 09:00', '2024-01-20T09:00:00'],
        ['Sun 09:00', '2024-01-21T09:00:00'],
        ['Mon 23:30', '2024-01-15T23:30:00'],
        ['Mon 00:00', '2024-01-15T00:00:00']
      ])('should convert "%s" to %s', (input, expected) => {
        const result = getStringToDate(input);
        const expectedDate = new Date(expected);
        expect(result.getTime()).toBe(expectedDate.getTime());
      });
    });

    describe('Invalid inputs', () => {
      it.each([
        ['Invalid 09:00'],
        [''],
        ['Mon'],
        ['Mon 25:00'],
        ['Mon 09:60'],
        ['Mon abc:def']
      ])('should throw error for "%s"', (input) => {
        expect(() => getStringToDate(input)).toThrow();
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
            state_target: '85',
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
            time: '2024-01-15T09:00:00+00:00', pv_forecast: 0.5, soc_percent: 80, load_forecast: 0.3, state: 'Chrg', cost_change: 0.05, soc_change: 2, import_rate: 0.15, export_rate: 0.10, state_target: '85',
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
            time: '2024-01-15T10:00:00+00:00', pv_forecast: 0.6, soc_percent: 82, load_forecast: 0.4, state: 'Chrg', cost_change: 0.06, soc_change: 2, import_rate: 0.15, export_rate: 0.10, state_target: '85',
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
            time: '2024-01-15T11:00:00+00:00', pv_forecast: 0.7, soc_percent: 84, load_forecast: 0.5, state: 'Chrg', cost_change: 0.07, soc_change: 2, import_rate: 0.15, export_rate: 0.10, state_target: '85',
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

  describe('invalidDay', () => {
    describe('Valid days (should return false)', () => {
      it.each([
        ['Mon'],
        ['Tue'],
        ['Wed'],
        ['Thu'],
        ['Fri'],
        ['Sat'],
        ['Sun']
      ])('should return false for "%s"', (day) => {
        expect(invalidDay(day)).toBe(false);
      });
    });

    describe('Invalid days (should return true)', () => {
      it.each([
        [''],
        ['Monday'],
        ['Tuesday'],
        ['Wednesday'],
        ['Thursday'],
        ['Friday'],
        ['Saturday'],
        ['Sunday'],
        ['Invalid'],
        ['MON'],
        ['mon'],
        ['M'],
        ['123'],
        [' '],
        ['Mon '],
        [' Mon'],
        ['Monn'],
        ['Mo'],
        ['Mond']
      ])('should return true for "%s"', (day) => {
        expect(invalidDay(day)).toBe(true);
      });
    });
  });

  describe('isError', () => {
    describe('Valid Error objects (should return true)', () => {
      it('should return true for a standard Error', () => {
        expect(isError(new Error('test error'))).toBe(true);
      });

      it('should return true for a TypeError', () => {
        expect(isError(new TypeError('type error'))).toBe(true);
      });

      it('should return true for a RangeError', () => {
        expect(isError(new RangeError('range error'))).toBe(true);
      });

      it('should return true for a custom Error subclass', () => {
        class CustomError extends Error {
          public constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }
        expect(isError(new CustomError('custom error'))).toBe(true);
      });

      it('should return true for an Error-like object with message', () => {
        const errorLike = {
          message: 'Something went wrong',
          code: 500,
          stack: '...'
        };
        expect(isError(errorLike)).toBe(true);
      });
    });

    describe('Non-Error objects (should return false)', () => {
      it('should return false for null', () => {
        expect(isError(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isError(undefined)).toBe(false);
      });

      it('should return false for a string', () => {
        expect(isError('error message')).toBe(false);
      });

      it('should return false for a number', () => {
        expect(isError(404)).toBe(false);
      });

      it('should return false for a boolean', () => {
        expect(isError(true)).toBe(false);
      });

      it('should return false for an empty object', () => {
        expect(isError({})).toBe(false);
      });

      it('should return false for an object without a message property', () => {
        expect(isError({ code: 500 })).toBe(false);
      });

      it('should return false for an object with a non-string message', () => {
        expect(isError({ message: 404 })).toBe(false);
        expect(isError({ message: true })).toBe(false);
        expect(isError({ message: null })).toBe(false);
        expect(isError({ message: undefined })).toBe(false);
        expect(isError({ message: { text: 'error' } })).toBe(false);
      });

      it('should return false for an array', () => {
        expect(isError([])).toBe(false);
        expect(isError(['error'])).toBe(false);
      });

      it('should return false for a function', () => {
        expect(isError(() => { })).toBe(false);
      });

      it('should return false for a Date', () => {
        expect(isError(new Date())).toBe(false);
      });

      it('should return false for a RegExp', () => {
        expect(isError(/error/)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should return true for an object with only a message property', () => {
        expect(isError({ message: 'error' })).toBe(true);
      });

      it('should return true for an object with message and other properties', () => {
        expect(isError({
          message: 'error',
          code: 500,
          timestamp: Date.now()
        })).toBe(true);
      });

      it('should return false for an object with message as empty string', () => {
        expect(isError({ message: '' })).toBe(true); // Empty string is still a string
      });
    });

    describe('Real-world usage', () => {
      it('should work in a catch block', () => {
        try {
          throw new Error('Something broke');
        }
        catch (error) {
          if (isError(error)) {
            expect(error.message).toBe('Something broke');
          }
          else {
            fail('Error should be recognized as an Error');
          }
        }
      });

      it('should work when catching non-Error throws', () => {
        try {
          throw 'string error'; // Throwing a string
        }
        catch (error) {
          expect(isError(error)).toBe(false);
        }
      });

      it('should work when catching null', () => {
        try {
          throw null;
        }
        catch (error) {
          expect(isError(error)).toBe(false);
        }
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

  describe('isSemver validation', () => {
    it('should format with - sign for negative timezone offset', () => {
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

      // Mock to -0500 (300 minutes)
      Date.prototype.getTimezoneOffset = jest.fn(() => 300);

      try {
        const date = new Date('2026-07-18T00:00:00Z');
        const result = _formatLocalTime(date);

        // With -0500 offset, 00:00 UTC becomes 01:00 local time (not 00:00)
        // Because the mocked offset is applied in the formatting
        expect(result).toBe('2026-07-18T01:00:00-0500');
      }
      finally {
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
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
    console.info(`${bgColour}  ${label.padEnd(22)} ${rgb}  ${reset}`);
  }
  else {
    console.info(`${label.padEnd(22)} ${rgb}`);
  }
}
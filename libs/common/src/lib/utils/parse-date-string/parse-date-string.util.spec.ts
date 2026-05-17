import { describe, it, expect } from 'vitest';
import { parseDateString } from './parse-date-string.util';

describe('parseDateString', () => {
	it('should return null for empty or undefined input', () => {
		expect(parseDateString()).toBeNull();
		expect(parseDateString('')).toBeNull();
	});

	it('should return null if the value cannot be parsed as a date', () => {
		expect(parseDateString('not a date')).toBeNull();
	});

	it('should parse a valid ISO date string by default', () => {
		const date = new Date('1995-07-14T00:00:00Z');
		const isoString = date.toISOString();
		const result = parseDateString(isoString);
		expect(result).toBeInstanceOf(Date);
		expect(result?.toISOString()).toEqual(isoString);
	});

	it('should parse a date string using custom formats', () => {
		const customDateString = '14/07/1995';
		const expectedDate = new Date(1995, 6, 14);
		const result = parseDateString(customDateString, ['dd/MM/yyyy']);
		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toEqual(expectedDate.getTime());
	});

	it('should return null if none of the custom formats match', () => {
		const result = parseDateString('14-07-1995', ['dd/MM/yyyy']);
		expect(result).toBeNull();
	});
});

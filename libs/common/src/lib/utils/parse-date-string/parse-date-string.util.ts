import { isValid as isValidDate, parse as parseDate, parseJSON } from 'date-fns';

/**
 * Parses a date string into a Date object, it optionally accepts formats for custom date strings.
 *
 * @param {string} [value] - The date string to parse.
 * @param {string[]} [formats] - An array of date formats to use for parsing.
 * @returns {Date|null} The parsed Date object, or null if the string cannot be parsed.
 */
export function parseDateString(value?: string, formats: string[] = []): Date | null {
	if (!value) return null;

	if (formats.length === 0) {
		const parsed = parseJSON(value);
		return isValidDate(parsed) ? parsed : null;
	}

	for (const format of formats) {
		const parsed = parseDate(value, format, new Date());
		if (isValidDate(parsed)) return parsed;
	}

	return null;
}

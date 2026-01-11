import { formatDate, isValid as isValidDate, parse as parseDate, parseJSON } from 'date-fns';
import { DATE_FORMATS } from '../../models/constants';

/**
 * Parses a date string into a Date object, it optionally accepts formats for custom date strings.
 *
 * @param {string} [value] - The date string to parse.
 * @param {string[]} [formats] - An array of date formats to use for parsing.
 * @returns {Date|null} The parsed Date object, or null if the string cannot be parsed.
 */
export function parseDateString(value?: string, formats: string[] = DATE_FORMATS): Date | null {
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

/**
 * Formats a Date object into a string, it optionally accepts a format for custom date strings.
 *
 * @param {Date} [value] - The Date object to format.
 * @param {string} [format] - The date format to use for formatting. Defaults to ISO 8601 format.
 * @returns {string|null} The formatted date string, or null if the date is invalid or not provided.
 */
export function formatDateString(value?: Date | null, format?: string): string | null {
	if (!value || !isValidDate(value)) return null;

	if (!format) {
		// Default to ISO 8601 format (e.g., "2024-01-08T10:30:00.000Z")
		return value.toISOString();
	}

	return formatDate(value, format);
}

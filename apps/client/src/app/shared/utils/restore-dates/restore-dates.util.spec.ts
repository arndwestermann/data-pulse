import { parseJSON } from 'date-fns';
import { restoreDates } from './restore-dates.util';
describe('restoreDates', () => {
	it('should return the same object if it is not an object', () => {
		expect(restoreDates('hello')).toEqual('hello');
		expect(restoreDates(123)).toEqual(123);
		expect(restoreDates(null)).toEqual(null);
		expect(restoreDates(undefined)).toEqual(undefined);
	});

	it('should convert ISO string dates to actual Date objects', () => {
		const dateString = '1995-07-14T12:56:52.000Z';
		const date = parseJSON(dateString);
		const object = { date: dateString };
		const result = restoreDates(object);
		expect(result.date).toEqual(date);
	});
	it('should convert string dates without time zone offset to actual Date objects', () => {
		const dateString = '1995-07-14 12:56:52';
		const date = parseJSON(dateString);
		const object = { date: dateString };
		const result = restoreDates(object);
		expect(result.date).toEqual(date);
	});

	it('should not modify non-string values', () => {
		const object = { date: 123, name: 'John', age: null };
		const result = restoreDates(object);
		expect(result).toEqual(object);
	});

	it('should not modify invalid dates', () => {
		const object = { date: 'not a date' };
		const result = restoreDates(object);
		expect(result).toEqual(object);
	});

	it('should recursively convert dates in nested objects', () => {
		const dateString = '1995-07-14T12:56:52.000Z';
		const date = parseJSON(dateString);
		const object = {
			date: dateString,
			person: {
				birthday: dateString,
			},
		};
		const result = restoreDates(object);
		expect(result.date).toEqual(date);
		expect(result.person.birthday).toEqual(date);
	});
});

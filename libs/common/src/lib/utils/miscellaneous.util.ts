import { RemoveNull } from '../models/remove-null.model';
import { IError } from '../models/error.model';
import { FilterCondition } from '../models/query.model';

export function uuid(): string {
	if ('randomUUID' in crypto) return crypto.randomUUID();

	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function isObject(object: unknown): object is Record<string, unknown> {
	return object !== null && typeof object === 'object';
}

export function roughSizeOfObject(object: unknown): number {
	const objectList = [];
	const stack = [object];
	let bytes = 0;

	while (stack.length) {
		const value = stack.pop();

		if (typeof value === 'boolean') {
			bytes += 4;
		} else if (typeof value === 'string') {
			bytes += value.length * 2;
		} else if (typeof value === 'number') {
			bytes += 8;
		} else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
			objectList.push(value);

			// eslint-disable-next-line
			for (let i in value) {
				if (Object.prototype.hasOwnProperty.call(value, i)) {
					// TODO: Check for better type
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					stack.push((value as any)[i]);
				}
			}
		}
	}
	return bytes;
}

export function removeNull<T extends object>(obj: T): RemoveNull<T> {
	return Object.fromEntries(
		Object.entries(obj)
			.filter(([_, value]) => value != null)
			.map(([key, value]) => {
				const removed = value === Object(value) ? removeNull(value) : value;
				return [key, Object.entries(removed).length > 0 ? removed : null];
			})
			.filter(([_, value]) => value != null),
	) as RemoveNull<T>;
}

export function notNullish<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

export function isError<T>(object: T | IError): object is IError {
	return object !== null && object !== undefined && typeof object === 'object' && 'error' in object;
}

export function isFilterCondition<T>(object: T | FilterCondition): object is FilterCondition {
	return object !== null && object !== undefined && typeof object === 'object' && 'operator' in object;
}

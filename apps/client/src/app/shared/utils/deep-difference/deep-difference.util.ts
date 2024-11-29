import { isEqual } from 'date-fns';
import { DeepDiff, Updated } from '../../models';

/**
 * Calculates the difference between two objects.
 *
 * Kudos to https://stackoverflow.com/a/61406094
 *
 * @param oldObj The original object.
 * @param newObj The new object.
 * @param deep Optional. Whether to perform a deep comparison. Default is true.
 * @returns An ObjectDiff object containing the added, updated, removed, and unchanged properties.
 */
export function deepDifference(oldObj: Record<string, unknown>, newObj: Record<string, unknown>, deep = true): DeepDiff {
	// Initialize the returned object
	const added: Record<string, unknown> = {};
	const updated: { [key: string]: Updated | DeepDiff } = {};
	const removed: Record<string, unknown> = {};
	const unchanged: Record<string, unknown> = {};

	// Iterate over the properties of the old object
	for (const oldProp in oldObj) {
		if (Object.prototype.hasOwnProperty.call(oldObj, oldProp)) {
			const newPropValue = newObj[oldProp];
			const oldPropValue = oldObj[oldProp];

			// If the property exists in the new object
			if (Object.prototype.hasOwnProperty.call(newObj, oldProp)) {
				// If the values are the same, mark it as unchanged
				const isDate = oldPropValue instanceof Date && newPropValue instanceof Date;
				const isSameValue = isDate ? isEqual(oldPropValue, newPropValue) : oldPropValue === newPropValue;
				if (isSameValue) {
					unchanged[oldProp] = oldPropValue;
				} else {
					// If deep comparison is enabled and both values are objects, recursively calculate the difference
					if (deep && !isDate && isObject(oldPropValue) && isObject(newPropValue)) {
						const nestedDiff = deepDifference(oldPropValue, newPropValue, deep);
						if (nestedDiff.isDifferent) {
							updated[oldProp] = nestedDiff;
						} else {
							let value: Record<string, unknown> | unknown[] = nestedDiff.unchanged;
							const isArray = Array.isArray(oldPropValue) && Array.isArray(newPropValue);
							if (isArray) {
								const newArray: unknown[] = [];
								for (const key in nestedDiff.unchanged) {
									if (Object.prototype.hasOwnProperty.call(nestedDiff.unchanged, key)) {
										const element = nestedDiff.unchanged[key];
										newArray.push(element);
									}
								}
								value = newArray;
							}

							unchanged[oldProp] = value;
						}
					} else {
						// Otherwise, mark it as updated
						updated[oldProp] = { oldValue: oldPropValue, newValue: newPropValue };
					}
				}
			} else {
				// If the property does not exist in the new object, mark it as removed
				removed[oldProp] = oldPropValue;
			}
		}
	}

	// Iterate over the properties of the new object
	for (const newProp in newObj) {
		if (Object.prototype.hasOwnProperty.call(newObj, newProp)) {
			const oldPropValue = oldObj[newProp];
			const newPropValue = newObj[newProp];

			// If the property does not exist in the old object
			if (Object.prototype.hasOwnProperty.call(oldObj, newProp)) {
				// If the values are different and deep comparison is not enabled or the old value is not an object
				if (oldPropValue !== newPropValue && (!deep || !isObject(oldPropValue))) {
					// Mark it as updated
					updated[newProp] = { oldValue: oldPropValue, newValue: newPropValue };
				}
			} else {
				// If the property does not exist in the old object, mark it as added
				added[newProp] = newPropValue;
			}
		}
	}

	const isDifferent = Object.keys(added).length > 0 || Object.keys(removed).length > 0 || Object.keys(updated).length > 0;

	// Return the calculated difference
	return { added, updated, removed, unchanged, isDifferent };
}

export function isObject(object: unknown): object is Record<string, unknown> {
	return object !== null && typeof object === 'object';
}

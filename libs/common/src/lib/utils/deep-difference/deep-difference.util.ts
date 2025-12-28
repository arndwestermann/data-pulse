import { isEqual } from 'date-fns';
import { isObject } from '../miscellaneous.util';
import { ObjectDiff, Updated } from '../../models/object-diff.model';

type ArrayMatchStrategy = 'strict' | 'smart';
type IdentityFn<T = unknown> = (item: T) => unknown;

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
export function deepDifference(
	oldObj: Record<string, unknown>,
	newObj: Record<string, unknown>,
	deep = true,
	respectOrder = true,
	matchStrategy: ArrayMatchStrategy = 'smart',
	identityFn?: IdentityFn,
): ObjectDiff {
	const added: Record<string, unknown> = {};
	const updated: { [key: string]: Updated | ObjectDiff } = {};
	const removed: Record<string, unknown> = {};
	const unchanged: Record<string, unknown> = {};

	// Handle keys from old object
	for (const oldProp in oldObj) {
		if (!Object.prototype.hasOwnProperty.call(oldObj, oldProp)) continue;

		const oldPropValue = oldObj[oldProp];
		const newPropValue = newObj[oldProp];

		if (Object.prototype.hasOwnProperty.call(newObj, oldProp)) {
			const isDate = oldPropValue instanceof Date && newPropValue instanceof Date;
			const isSameValue = isDate ? isEqual(oldPropValue, newPropValue) : oldPropValue === newPropValue;

			if (isSameValue) {
				unchanged[oldProp] = oldPropValue;
			} else if (deep && !isDate && isObject(oldPropValue) && isObject(newPropValue)) {
				if (Array.isArray(oldPropValue) && Array.isArray(newPropValue)) {
					// ✅ Delegate to deepDifferenceArray with forwarded params
					const nestedDiff = deepDifferenceArray(oldPropValue, newPropValue, deep, respectOrder, matchStrategy, identityFn);

					if (nestedDiff.isDifferent) {
						updated[oldProp] = nestedDiff;
					} else {
						unchanged[oldProp] = nestedDiff.unchanged;
					}
				} else {
					// ✅ Regular object comparison
					const nestedDiff = deepDifference(
						oldPropValue as Record<string, unknown>,
						newPropValue as Record<string, unknown>,
						deep,
						respectOrder,
						matchStrategy,
						identityFn,
					);

					if (nestedDiff.isDifferent) {
						updated[oldProp] = nestedDiff;
					} else {
						unchanged[oldProp] = nestedDiff.unchanged;
					}
				}
			} else {
				// ✅ Mark as updated
				updated[oldProp] = { oldValue: oldPropValue, newValue: newPropValue };
			}
		} else {
			// ✅ Property removed
			removed[oldProp] = oldPropValue;
		}
	}

	// Handle keys only in new object
	for (const newProp in newObj) {
		if (!Object.prototype.hasOwnProperty.call(newObj, newProp)) continue;

		const oldPropValue = oldObj[newProp];
		const newPropValue = newObj[newProp];

		if (!Object.prototype.hasOwnProperty.call(oldObj, newProp)) {
			// ✅ Property added
			added[newProp] = newPropValue;
		} else if (oldPropValue !== newPropValue && (!deep || !isObject(oldPropValue))) {
			// ✅ Updated if not deep or not objects
			updated[newProp] = { oldValue: oldPropValue, newValue: newPropValue };
		}
	}

	const isDifferent = Object.keys(added).length > 0 || Object.keys(removed).length > 0 || Object.keys(updated).length > 0;

	return { added, updated, removed, unchanged, isDifferent };
}

/**
 * Calculates the difference between two arrays.
 *
 * @param oldArr The original array.
 * @param newArr The new array.
 * @param deep Optional. Whether to perform a deep comparison. Default is true.
 * @param respectOrder Optional. Whether to consider element order. Default is true.
 * @param matchStrategy Optional. "strict" = remove+add on any mismatch, "smart" = detect updates. Default is "strict".
 * @param identityFn Optional. Custom function to determine if two elements are the "same entity" (used only in smart mode).
 */
export function deepDifferenceArray<T = unknown>(
	oldArr: T[],
	newArr: T[],
	deep = true,
	respectOrder = true,
	matchStrategy: ArrayMatchStrategy = 'smart',
	identityFn?: IdentityFn<T>,
): ObjectDiff {
	const added: Record<string, unknown> = {};
	const removed: Record<string, unknown> = {};
	const updated: { [key: string]: Updated | ObjectDiff } = {};
	const unchanged: Record<string, unknown> = {};

	if (respectOrder) {
		// Order-sensitive comparison
		const maxLength = Math.max(oldArr.length, newArr.length);
		for (let i = 0; i < maxLength; i++) {
			const oldItem = oldArr[i];
			const newItem = newArr[i];

			if (i >= oldArr.length) {
				added[i] = newItem;
			} else if (i >= newArr.length) {
				removed[i] = oldItem;
			} else {
				if (deep && isObject(oldItem) && isObject(newItem)) {
					const nestedDiff = deepDifference(oldItem as Record<string, unknown>, newItem as Record<string, unknown>, deep);
					if (nestedDiff.isDifferent) {
						updated[i] = nestedDiff;
					} else {
						unchanged[i] = oldItem;
					}
				} else if (oldItem instanceof Date && newItem instanceof Date) {
					if (isEqual(oldItem, newItem)) {
						unchanged[i] = oldItem;
					} else {
						updated[i] = { oldValue: oldItem, newValue: newItem };
					}
				} else if (oldItem !== newItem) {
					updated[i] = { oldValue: oldItem, newValue: newItem };
				} else {
					unchanged[i] = oldItem;
				}
			}
		}
	} else {
		// Order-insensitive comparison
		const oldCopy = [...oldArr];
		const newCopy = [...newArr];

		for (let i = 0; i < oldCopy.length; i++) {
			const oldItem = oldCopy[i];
			let matchIndex = -1;

			for (let j = 0; j < newCopy.length; j++) {
				const newItem = newCopy[j];

				let isSameEntity = false;

				if (matchStrategy === 'smart') {
					if (identityFn) {
						isSameEntity = identityFn(oldItem) === identityFn(newItem);
					} else if (deep && isObject(oldItem) && isObject(newItem)) {
						// fallback to deep comparison
						const nestedDiff = deepDifference(oldItem as Record<string, unknown>, newItem as Record<string, unknown>, deep);
						if (!nestedDiff.isDifferent) {
							isSameEntity = true;
						}
					}
				} else {
					// strict mode: compare by reference/value
					isSameEntity = (oldItem instanceof Date && newItem instanceof Date && isEqual(oldItem, newItem)) || oldItem === newItem;
				}

				if (isSameEntity) {
					// Found a match → check if updated or unchanged
					if (deep && isObject(oldItem) && isObject(newItem)) {
						const nestedDiff = deepDifference(oldItem as Record<string, unknown>, newItem as Record<string, unknown>, deep);
						if (nestedDiff.isDifferent) {
							updated[i] = nestedDiff;
						} else {
							unchanged[i] = oldItem;
						}
					} else if (oldItem !== newItem) {
						updated[i] = { oldValue: oldItem, newValue: newItem };
					} else {
						unchanged[i] = oldItem;
					}

					matchIndex = j;
					break;
				}
			}

			if (matchIndex >= 0) {
				newCopy.splice(matchIndex, 1);
			} else {
				removed[i] = oldItem;
			}
		}

		// Remaining = added
		newCopy.forEach((item, idx) => {
			added[idx] = item;
		});
	}

	const isDifferent = Object.keys(added).length > 0 || Object.keys(removed).length > 0 || Object.keys(updated).length > 0;

	return { added, removed, updated, unchanged, isDifferent };
}

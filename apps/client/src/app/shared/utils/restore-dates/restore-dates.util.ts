import { isValid, parseISO, parseJSON } from 'date-fns';

// eslint-disable-next-line
export function restoreDates(object: any) {
	if (typeof object === 'string') {
		const parsedDate = parseISO(object);

		if (isValid(parsedDate)) {
			return parsedDate;
		}
	}

	const newObject = structuredClone(object);

	for (const property in newObject) {
		if (Object.prototype.hasOwnProperty.call(newObject, property)) {
			const element = newObject[property];
			if (typeof element === 'object') {
				newObject[property] = restoreDates(element);
			} else if (typeof element === 'string') {
				const date = parseJSON(element);

				if (isValid(date)) {
					newObject[property] = date;
				}
			}
		}
	}

	return newObject;
}

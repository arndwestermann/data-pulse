import { maxLength, minLength, required, Schema, schema } from '@angular/forms/signals';
import { IField } from '@arndwestermann/common';

export function toSchema(meta: IField[]): Schema<unknown> {
	return schema<unknown>((path) => {
		for (const fieldDef of meta) {
			const prop = fieldDef.name;
			const fieldPath = (path as any)[prop];

			if (!fieldPath) {
				continue;
			}
			if (fieldDef.required) {
				required(fieldPath);
			}
			if (typeof fieldDef.minLength !== 'undefined') {
				minLength(fieldPath, fieldDef.minLength);
			}
			if (typeof fieldDef.maxLength !== 'undefined') {
				maxLength(fieldPath, fieldDef.maxLength);
			}
		}
	});
}

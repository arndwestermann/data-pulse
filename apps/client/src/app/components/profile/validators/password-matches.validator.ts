import { RootFieldContext, SchemaPath } from '@angular/forms/signals';

export function passwordMatchesValidator<T extends string | null>({ value, valueOf }: RootFieldContext<T>, confirmPassword: SchemaPath<T>) {
	if (value() !== valueOf(confirmPassword)) {
		return { kind: 'mustMatch' };
	}
	return undefined;
}

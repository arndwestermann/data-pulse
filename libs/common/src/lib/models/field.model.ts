import { ITranslation } from './translation.model';

export interface IField {
	name: string;
	label?: ITranslation;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	type?: 'text' | 'number' | 'date' | 'datetime' | 'checkbox' | 'radio' | 'dropdown';
}

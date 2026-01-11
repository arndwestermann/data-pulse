import { IField } from '@arndwestermann/common';

export const DATA_STORAGE_KEY = 'data';
export const AUTH_STORAGE_KEY = 'auth';
export const NEVER_ASK_DELETE_AGAIN_STORAGE_KEY = 'neverAskDeleteAgain';

export const CSV_LINE_SEPARATOR = '\r\n';
export const CSV_DATA_SEPARATOR = ';';

export const IS_PUBLIC_REQUEST = 'X-Is-Public';

export const STRENGTH_REGEX = new RegExp('^(?=.*[0-9]){1,}(?=.*[!?={}\\[\\]\\/\\|@#$%^&*()--__+.]){1,}.{1,}$');
export const RECORDS_MARKED_AS_CORRECT_STORAGE_KEY = 'markedAsCorrect';

export const DEFAULT_FIELDS: IField[] = [
	{ name: 'id', required: true, type: 'text' },
	{ name: 'arrival', required: true, type: 'datetime' },
	{ name: 'leaving', type: 'datetime' },
	{ name: 'from', type: 'text' },
	{ name: 'to', type: 'text' },
	{ name: 'specialty', required: true, type: 'dropdown' },
];

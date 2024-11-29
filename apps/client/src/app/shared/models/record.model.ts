export interface IRecord {
	uuid: string;
	id: string;
	arrival: Date;
	leaving: Date;
	from: string;
	to: string;
	specialty: Specialty;
	status: Status | null;
}

export const SPECIALTIES = [
	'internal',
	'su',
	'internalKV',
	'vascular',
	'general',
	'trauma',
	'internalCoro',
	'internalPVI',
	'suLyse',
	'ent',
	'neuro',
	'psych',
	'internalPM',
	'gyn',
	'internalZVK',
	'internalEPU',
	'internalPFO',
	'suNotcoro',
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const STATUS = ['error', 'caution', 'warning'] as const;

export type Status = (typeof STATUS)[number];

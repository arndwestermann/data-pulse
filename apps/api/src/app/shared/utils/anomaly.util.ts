export interface IRecord {
	uuid: string;
	id: string;
	arrival: Date;
	leaving?: Date;
	from: string;
	to: string;
	specialty: string;
}

type Anomaly = {
	index: number;
	uuid: string;
	issues: string[];
};

const REQUIRED_STRING_FIELDS = ['uuid', 'id', 'from', 'to'] as const;

export function findAnomalies(data: IRecord[]): Anomaly[] {
	const anomalies: Anomaly[] = [];
	const seenUuids = new Map<string, number>();
	const seenIds = new Map<string, number>();

	for (let i = 0; i < data.length; i++) {
		const entry = data[i];
		const issues: string[] = [];

		// String fields only
		for (const field of REQUIRED_STRING_FIELDS) {
			if (!entry[field]?.trim()) {
				issues.push(`missing field: ${field}`);
			}
		}

		// Specialty present
		if (!entry.specialty) {
			issues.push('missing field: specialty');
		}

		// Arrival must be valid Date
		if (!(entry.arrival instanceof Date) || isNaN(entry.arrival.getTime())) {
			issues.push(`invalid arrival date: "${entry.arrival}"`);
		}

		// Leaving optional — only validate if present
		if (entry.leaving !== undefined) {
			if (!(entry.leaving instanceof Date) || isNaN(entry.leaving.getTime())) {
				issues.push(`invalid leaving date: "${entry.leaving}"`);
			} else if (entry.arrival instanceof Date && !isNaN(entry.arrival.getTime()) && entry.arrival >= entry.leaving) {
				issues.push(`arrival not before leaving (${entry.arrival.toISOString()} >= ${entry.leaving.toISOString()})`);
			}
		}

		// Duplicates
		if (seenUuids.has(entry.uuid)) {
			issues.push(`duplicate uuid (first at index ${seenUuids.get(entry.uuid)})`);
		} else {
			seenUuids.set(entry.uuid, i);
		}

		if (seenIds.has(entry.id)) {
			issues.push(`duplicate id "${entry.id}" (first at index ${seenIds.get(entry.id)})`);
		} else {
			seenIds.set(entry.id, i);
		}

		if (issues.length > 0) {
			anomalies.push({ index: i, uuid: entry.uuid, issues });
		}
	}

	return anomalies;
}

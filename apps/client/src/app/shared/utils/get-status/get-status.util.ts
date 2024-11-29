import { differenceInHours } from 'date-fns';
import { Status } from '../../models';

export function getStatus(leaving: Date, arrival: Date): Status | null {
	const diff = differenceInHours(leaving, arrival);

	if (diff < 0) return 'error';
	else if (diff > 240) return 'caution';
	else if (diff > 120) return 'warning';
	else return null;
}

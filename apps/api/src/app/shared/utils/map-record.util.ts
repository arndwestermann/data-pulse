import { IRecordResponse } from '../../record/dto/record-response.dto';
import { Record } from '../../record/entities/record.entity';

export function mapRecordToResponse(record: Record): IRecordResponse {
	return {
		uuid: record.uuid,
		id: record.id,
		arrival: record.arrival,
		leaving: record.leaving,
		from: record.from,
		to: record.to,
		specialty: record.specialty,
	};
}

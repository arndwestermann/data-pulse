import { parseJSON } from 'date-fns';
import { IRecord, IRecordDto } from '../../models';

export function mapDtoToRecord(dto: IRecordDto): IRecord {
	const arrival = parseJSON(dto.arrival);
	const leaving = parseJSON(dto.leaving);
	return {
		uuid: dto.uuid,
		id: dto.id,
		from: dto.from,
		to: dto.to,
		arrival,
		leaving,
		specialty: dto.specialty,
	};
}

export function mapRecordToDto(record: IRecord): IRecordDto {
	return {
		uuid: record.uuid,
		id: record.id,
		from: record.from,
		to: record.to,
		leaving: record.leaving.toISOString(),
		arrival: record.arrival.toISOString(),
		specialty: record.specialty,
	};
}

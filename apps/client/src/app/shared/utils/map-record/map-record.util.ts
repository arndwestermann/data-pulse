import { parseJSON } from 'date-fns';
import { IRecord, IRecordDto } from '../../models';

export function mapDtoToRecord(dto: IRecordDto): IRecord {
	const arrival = parseJSON(dto.arrival);
	const leaving = dto.leaving ? parseJSON(dto.leaving) : undefined;
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
	let arrival = '';
	let leaving = '';
	try {
		arrival = record.arrival.toISOString();
		leaving = record.leaving?.toISOString() ?? '';
	} catch (err) {
		console.log(record);
		throw new Error(err as any);
	}
	return {
		uuid: record.uuid,
		id: record.id,
		from: record.from,
		to: record.to,
		leaving: leaving ?? '',
		arrival: arrival ?? '',
		specialty: record.specialty,
	};
}

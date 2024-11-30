export class CreateRecordDto {
	id: string;
	arrival: Date;
	leaving: Date;
	from: string;
	to: string;
	specialty: string;
	userUUID: string;
}

import { Injectable, Logger } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, Observable, of, switchMap } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class RecordService {
	private readonly logger = new Logger('RecordService');
	constructor(
		@InjectRepository(Record) private readonly recordRepository: Repository<Record | null>,
		private readonly userService: UserService,
	) {}

	public create(createRecordDto: CreateRecordDto, user: string): Observable<Record> {
		return this.userService.findOneById(user).pipe(
			switchMap((user) => {
				const record = new Record();
				record.id = createRecordDto.id;
				record.arrival = createRecordDto.arrival;
				record.leaving = createRecordDto.leaving;
				record.from = createRecordDto.from;
				record.to = createRecordDto.to;
				record.specialty = createRecordDto.specialty;
				record.user = user;

				return from(this.recordRepository.save(record));
			}),
		);
	}

	public findAll(user: string): Observable<Record[]> {
		return from(
			this.recordRepository.find({
				where: {
					user: {
						uuid: user,
					},
				},
			}),
		);
	}

	public findOne(uuid: string, user: string): Observable<Record | null> {
		return from(
			this.recordRepository.findOne({
				where: {
					uuid,
					user: {
						uuid: user,
					},
				},
			}),
		);
	}

	public update(uuid: string, updateRecordDto: UpdateRecordDto, user: string): Observable<Record | null> {
		return this.userService.findOneById(user).pipe(
			switchMap((user) => this.findOne(uuid, user.uuid)),
			switchMap((record) => {
				if (!record) return of(null);

				if (updateRecordDto.id) record.id = updateRecordDto.id;
				if (updateRecordDto.arrival) record.arrival = updateRecordDto.arrival;
				if (updateRecordDto.leaving) record.leaving = updateRecordDto.leaving;
				if (updateRecordDto.from) record.from = updateRecordDto.from;
				if (updateRecordDto.to) record.to = updateRecordDto.to;
				if (updateRecordDto.specialty) record.specialty = updateRecordDto.specialty;

				return from(this.recordRepository.save(record));
			}),
		);
	}

	public remove(uuid: string, user: string) {
		return from(
			this.recordRepository.delete({
				uuid,
				user: {
					uuid: user,
				},
			}),
		).pipe(
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return of(uuid);
				else return of(null);
			}),
		);
	}
}

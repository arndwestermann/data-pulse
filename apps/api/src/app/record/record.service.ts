import { Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class RecordService {
	constructor(
		@InjectRepository(Record) private readonly recordRepository: Repository<Record>,
		private readonly userService: UserService,
	) {}

	public create(createRecordDto: CreateRecordDto): Observable<Record> {
		return this.userService.findOne(createRecordDto.user).pipe(
			switchMap((user) => {
				const record = this.recordRepository.create({
					...createRecordDto,
					user,
				});

				return from(this.recordRepository.save(record));
			}),
		);
	}

	public findAll(): Observable<Record[]> {
		return from(this.recordRepository.find({ relations: ['user'] })).pipe(
			map((records) =>
				records.map((record) => {
					delete record.user.hashedPassword;
					return record;
				}),
			),
		);
	}

	public findOne(uuid: string) {
		return from(this.recordRepository.findOne({ where: { uuid }, relations: ['user'] })).pipe(
			map((record) => {
				delete record.user.hashedPassword;
				return record;
			}),
		);
	}

	public update(uuid: string, updateRecordDto: UpdateRecordDto) {
		return this.userService.findOne(updateRecordDto.user).pipe(
			switchMap((user) => from(this.recordRepository.update(uuid, { ...updateRecordDto, user }))),
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return this.findOne(uuid);

				return of(null);
			}),
		);
	}

	public remove(uuid: string) {
		return from(this.recordRepository.delete(uuid)).pipe(
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return of(uuid);
				else return of(null);
			}),
		);
	}
}

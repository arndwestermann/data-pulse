import { Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, Observable, of, switchMap } from 'rxjs';

@Injectable()
export class RecordService {
	constructor(@InjectRepository(Record) private readonly recordRepository: Repository<Record>) {}

	public create(createRecordDto: CreateRecordDto): Observable<Record> {
		const record = this.recordRepository.create(createRecordDto);

		return from(this.recordRepository.save(record));
	}

	public findAll(): Observable<Record[]> {
		return from(this.recordRepository.find());
	}

	public findOne(uuid: string) {
		return from(this.recordRepository.findOne({ where: { uuid } }));
	}

	public update(uuid: string, updateRecordDto: UpdateRecordDto) {
		return from(this.recordRepository.update(uuid, updateRecordDto)).pipe(
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

import { Injectable, Logger } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { UserService } from '../user/user.service';
import { applyDynamicFilters, DEFAULT_ORDER, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, IError, IQueryOptions } from '@arndwestermann/common';

@Injectable()
export class RecordService {
	private readonly logger = new Logger('RecordService');
	constructor(
		@InjectRepository(Record) private readonly recordRepository: Repository<Record>,
		private readonly userService: UserService,
	) {}

	public create(createRecordDto: CreateRecordDto, user: string): Observable<Record | null> {
		return this.userService.findOneById(user).pipe(
			switchMap((user) => {
				if (!user) return of(null);

				const record = new Record();
				record.id = createRecordDto.id;
				record.arrival = createRecordDto.arrival;
				record.leaving = createRecordDto.leaving ?? null;
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

	public findAllV2(
		userId: string,
		{ page = DEFAULT_PAGE, size = DEFAULT_PAGE_SIZE, order = DEFAULT_ORDER, filters }: IQueryOptions,
	): Observable<{ data: Record[]; count: number } | IError> {
		const offset = (page - 1) * size;
		const direction = order.toUpperCase() as 'ASC' | 'DESC';
		const alias = 'record';

		const qb = this.recordRepository.createQueryBuilder(alias).addSelect(`case when ISNULL(${alias}.leaving) then 1 else 0 end`, 'leavingNullLast');

		applyDynamicFilters(qb, alias, userId, filters, ['arrival', 'leaving']);

		qb.addSelect(`(CASE WHEN ${alias}.leaving IS NULL THEN 1 ELSE 0 END)`, 'leavingNullLast')
			.addOrderBy('arrival', direction)
			.addOrderBy('leaving', direction);

		qb.skip(offset).take(size);

		return from(qb.getManyAndCount()).pipe(map(([data, count]) => ({ data, count })));
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

	public findeOneByRecordId(id: string, user: string): Observable<Record | null> {
		return from(
			this.recordRepository.findOne({
				where: {
					id,
					user: {
						uuid: user,
					},
				},
			}),
		);
	}

	public update(uuid: string, updateRecordDto: UpdateRecordDto, user: string): Observable<Record | null> {
		return this.userService.findOneById(user).pipe(
			switchMap((user) => (user ? this.findOne(uuid, user.uuid) : of(null))),
			switchMap((record) => {
				if (!record) return of(null);

				record.leaving = updateRecordDto.leaving ?? null;
				if (updateRecordDto.id) record.id = updateRecordDto.id;
				if (updateRecordDto.arrival) record.arrival = updateRecordDto.arrival;
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

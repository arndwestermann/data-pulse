import { Injectable, Logger } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { UserService } from '../user/user.service';
import {
	applyDynamicFilters,
	DEFAULT_ORDER,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	IError,
	IQueryOptions,
	isFilterCondition,
	KeyValue,
	parseDateString,
} from '@arndwestermann/common';
import { QueryOptions } from '../shared/models';
import { endOfMonth, startOfMonth } from 'date-fns';
import { getHeatMap } from '../shared/utils/heat-map.util';

@Injectable()
export class RecordService {
	private readonly _ = new Logger('RecordService');
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
		{ page = DEFAULT_PAGE, size = DEFAULT_PAGE_SIZE, order = DEFAULT_ORDER, filters }: QueryOptions,
	): Observable<{ data: Record[]; count: number } | IError> {
		const offset = (page - 1) * size;
		const direction = order.toUpperCase() as 'ASC' | 'DESC';
		const alias = 'record';

		const qb = this.recordRepository.createQueryBuilder(alias).addSelect(`(CASE WHEN ${alias}.leaving IS NULL THEN 1 ELSE 0 END)`, 'leavingNullLast');

		// Extract and strip range filter
		const { range, ...remainingFilters } = filters ?? {};
		let rangeStart: Date | undefined;
		let rangeEnd: Date | undefined;

		if (isFilterCondition(range) && Array.isArray(range.value)) {
			rangeStart = parseDateString(range.value[0]) ?? undefined;
			rangeEnd = parseDateString(range.value[1]) ?? undefined;
		}

		if (rangeStart && rangeEnd) {
			qb.andWhere(`${alias}.arrival <= :rangeEnd`, { rangeEnd }).andWhere(`(${alias}.leaving >= :rangeStart OR ${alias}.leaving IS NULL)`, {
				rangeStart,
			});
		}

		applyDynamicFilters(qb, alias, userId, remainingFilters, ['arrival', 'leaving']);

		qb.addOrderBy(`${alias}.arrival`, direction).addOrderBy(`${alias}.leaving`, direction).skip(offset).take(size);

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

	public getHeatmap(userId: string, { order = DEFAULT_ORDER, filters }: IQueryOptions): Observable<KeyValue<Date, Record[][]>[] | IError> {
		const alias = 'record';
		const direction = order.toUpperCase() as 'ASC' | 'DESC';

		let start: Date | undefined;
		let end: Date | undefined;

		const range = filters?.['range'];
		if (filters !== undefined && 'range' in filters && isFilterCondition(range) && Array.isArray(range.value)) {
			start = parseDateString(range.value[0]) ?? undefined;
			end = parseDateString(range.value[1]) ?? undefined;
		}

		const qb = this.recordRepository.createQueryBuilder(alias).addSelect(`(CASE WHEN ${alias}.leaving IS NULL THEN 1 ELSE 0 END)`, 'leavingNullLast');

		qb.andWhere(`${alias}.user = :userId`, { userId });

		const rangeStart = start ?? startOfMonth(new Date());
		const rangeEnd = end ?? endOfMonth(new Date());

		qb.andWhere(`${alias}.arrival <= :rangeEnd`, { rangeEnd }).andWhere(`(${alias}.leaving >= :rangeStart OR ${alias}.leaving IS NULL)`, {
			rangeStart,
		});

		qb.addOrderBy(`${alias}.arrival`, direction).addOrderBy(`${alias}.leaving`, direction);

		return from(qb.getMany()).pipe(map((records) => getHeatMap(records, rangeStart, rangeEnd)));
	}
}

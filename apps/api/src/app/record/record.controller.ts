import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Logger,
	Res,
	HttpStatus,
	UseGuards,
	Query,
	BadRequestException,
	InternalServerErrorException,
	Version,
} from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { User } from '../authentication/decorators';
import { TokenPayload } from '../authentication/models';
import { IRecordResponse } from './dto/record-response.dto';
import { map } from 'rxjs';
import { mapRecordToResponse } from '../shared';
import { Response } from 'express';
import { AuthorizationGuard } from '../role/guards/authorization.guard';
import { Permission } from '../shared/decorators';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, IPage, isError, KeyValue } from '@arndwestermann/common';
import { QueryOptions } from '../shared/models';

@UseGuards(AuthorizationGuard)
@Controller('record')
export class RecordController {
	private readonly _ = new Logger('RecordController');
	constructor(private readonly recordService: RecordService) {}

	@Permission({ ressource: 'record', actions: ['create'] })
	@Post()
	create(@Res() res: Response<IRecordResponse | string>, @Body() createRecordDto: CreateRecordDto, @User() user: TokenPayload) {
		return this.recordService
			.create(createRecordDto, user.sub)
			.pipe(
				map((record) =>
					res.status(record ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST).send(record ? mapRecordToResponse(record) : 'User not found'),
				),
			);
	}

	@Permission({ ressource: 'record', actions: ['read'] })
	@Get()
	findAll(@User() user: TokenPayload) {
		return this.recordService.findAll(user.sub);
	}

	@Version('beta')
	@Permission({ ressource: 'record', actions: ['read'] })
	@Get()
	findAllV2(@Res() response: Response<IPage<IRecordResponse[]>>, @Query() options: QueryOptions, @User() user: TokenPayload) {
		return this.recordService.findAllV2(user.sub, options).pipe(
			map((value) => {
				if (!isError(value)) {
					return response.status(HttpStatus.OK).send({
						data: value.data.map(mapRecordToResponse),
						itemsPerPage: options.size ?? DEFAULT_PAGE_SIZE,
						page: options.page ?? DEFAULT_PAGE,
						totalItems: value.count,
					});
				}

				switch (value.status) {
					case HttpStatus.BAD_REQUEST:
						throw new BadRequestException(value.statusText);

					default:
						throw new InternalServerErrorException(value.statusText);
				}
			}),
		);
	}

	// TODO: move to own endpoint, it is currently here because of there is no resource yet for it for the role management
	@Permission({ ressource: 'record', actions: ['read'] })
	@Get('heat-map')
	getHeatmap(@Res() response: Response<IPage<KeyValue<Date, IRecordResponse[][]>[]>>, @Query() options: QueryOptions, @User() user: TokenPayload) {
		return this.recordService.getHeatmap(user.sub, options).pipe(
			map((value) => {
				if (!isError(value)) {
					const data = value.map((item) => ({ ...item, value: item.value.map((hour) => hour.map(mapRecordToResponse)) }));
					return response.status(HttpStatus.OK).send({
						data,
						itemsPerPage: -1,
						page: -1,
						totalItems: data.length,
					});
				}

				switch (value.status) {
					case HttpStatus.BAD_REQUEST:
						throw new BadRequestException(value.statusText);

					default:
						throw new InternalServerErrorException(value.statusText);
				}
			}),
		);
	}

	@Permission({ ressource: 'record', actions: ['read'] })
	@Get(':id')
	findOne(@Res() res: Response<IRecordResponse>, @Param('id') id: string, @User() user: TokenPayload) {
		const isUuid = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i) !== null;

		const request$ = isUuid ? this.recordService.findOne(id, user.sub) : this.recordService.findeOneByRecordId(id, user.sub);
		return request$.pipe(
			map((value) => {
				if (!value) return res.status(HttpStatus.NOT_FOUND).send();

				return res.status(HttpStatus.OK).send(mapRecordToResponse(value));
			}),
		);
	}

	@Permission({ ressource: 'record', actions: ['update'] })
	@Patch(':uuid')
	update(@Res() res: Response<IRecordResponse>, @Param('uuid') uuid: string, @Body() updateRecordDto: UpdateRecordDto, @User() user: TokenPayload) {
		return this.recordService.update(uuid, updateRecordDto, user.sub).pipe(
			map((value) => {
				if (!value) return res.status(HttpStatus.NOT_FOUND).send();

				return res.status(HttpStatus.OK).send(mapRecordToResponse(value));
			}),
		);
	}

	@Permission({ ressource: 'record', actions: ['delete'] })
	@Delete(':uuid')
	remove(@Res() res: Response<unknown>, @Param('uuid') uuid: string, @User() user: TokenPayload) {
		return this.recordService.remove(uuid, user.sub).pipe(map(() => res.status(201).send()));
	}
}

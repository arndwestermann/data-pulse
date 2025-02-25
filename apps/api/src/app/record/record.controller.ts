import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Res, HttpStatus, UseGuards } from '@nestjs/common';
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

@UseGuards(AuthorizationGuard)
@Controller('record')
export class RecordController {
	private readonly logger = new Logger('RecordController');
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

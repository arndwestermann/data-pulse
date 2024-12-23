import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Res, HttpStatus, UseGuards } from '@nestjs/common';
import {} from '@nestjs/platform-express';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { User } from '../authentication/decorators';
import { AccessTokenPayload } from '../authentication/models';
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
	create(@Res() res: Response<IRecordResponse>, @Body() createRecordDto: CreateRecordDto, @User() user: AccessTokenPayload) {
		return this.recordService.create(createRecordDto, user.sub).pipe(map((record) => res.status(HttpStatus.OK).send(mapRecordToResponse(record))));
	}

	@Permission({ ressource: 'record', actions: ['read'] })
	@Get()
	findAll(@User() user: AccessTokenPayload) {
		return this.recordService.findAll(user.sub);
	}

	@Permission({ ressource: 'record', actions: ['read'] })
	@Get(':uuid')
	findOne(@Param('uuid') uuid: string, @User() user: AccessTokenPayload) {
		return this.recordService.findOne(uuid, user.sub);
	}

	@Permission({ ressource: 'record', actions: ['update'] })
	@Patch(':uuid')
	update(
		@Res() res: Response<IRecordResponse>,
		@Param('uuid') uuid: string,
		@Body() updateRecordDto: UpdateRecordDto,
		@User() user: AccessTokenPayload,
	) {
		return this.recordService.update(uuid, updateRecordDto, user.sub).pipe(
			map((value) => {
				if (!value) return res.status(HttpStatus.NOT_FOUND).send();

				return res.status(HttpStatus.OK).send(mapRecordToResponse(value));
			}),
		);
	}

	@Permission({ ressource: 'record', actions: ['delete'] })
	@Delete(':uuid')
	remove(@Res() res: Response<unknown>, @Param('uuid') uuid: string, @User() user: AccessTokenPayload) {
		return this.recordService.remove(uuid, user.sub).pipe(map(() => res.status(201).send()));
	}
}

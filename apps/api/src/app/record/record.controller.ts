import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { User } from '../authentication/decorators';
import { AccessTokenPayload } from '../authentication/models';

@Controller('record')
export class RecordController {
	private readonly logger = new Logger('RecordController');
	constructor(private readonly recordService: RecordService) {}

	@Post()
	create(@Body() createRecordDto: CreateRecordDto, @User() user: AccessTokenPayload) {
		return this.recordService.create(createRecordDto, user.sub);
	}

	@Get()
	findAll(@User() user: AccessTokenPayload) {
		return this.recordService.findAll(user.sub);
	}

	@Get(':uuid')
	findOne(@Param('uuid') uuid: string, @User() user: AccessTokenPayload) {
		return this.recordService.findOne(uuid, user.sub);
	}

	@Patch(':uuid')
	update(@Param('uuid') uuid: string, @Body() updateRecordDto: UpdateRecordDto, @User() user: AccessTokenPayload) {
		return this.recordService.update(uuid, updateRecordDto, user.sub);
	}

	@Delete(':uuid')
	remove(@Param('uuid') uuid: string, @User() user: AccessTokenPayload) {
		return this.recordService.remove(uuid, user.sub);
	}
}

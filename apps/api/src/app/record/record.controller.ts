import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Controller('record')
export class RecordController {
	constructor(private readonly recordService: RecordService) {}

	@Post()
	create(@Body() createRecordDto: CreateRecordDto) {
		return this.recordService.create(createRecordDto);
	}

	@Get()
	findAll() {
		return this.recordService.findAll();
	}

	@Get(':uuid')
	findOne(@Param('uuid') uuid: string) {
		return this.recordService.findOne(uuid);
	}

	@Patch(':uuid')
	update(@Param('uuid') uuid: string, @Body() updateRecordDto: UpdateRecordDto) {
		return this.recordService.update(uuid, updateRecordDto);
	}

	@Delete(':uuid')
	remove(@Param('uuid') uuid: string) {
		return this.recordService.remove(uuid);
	}
}

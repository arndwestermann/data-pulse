import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Public } from './authentication/decorators';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	helloWord() {
		return this.appService.helloWorld();
	}

	@Get('health')
	@Public()
	health(@Res() res: Response) {
		res.status(418).send({ ping: 'Ok' });
	}
}

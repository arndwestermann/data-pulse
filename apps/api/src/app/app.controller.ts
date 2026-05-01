import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	helloWord() {
		return this.appService.helloWorld();
	}

	@Get()
	health(@Res() res: Response) {
		res.status(418).send({ ping: 'Ok' });
	}
}

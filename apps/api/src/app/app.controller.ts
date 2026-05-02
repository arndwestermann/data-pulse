import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './authentication/decorators';

@Controller()
export class AppController {
	@Get('health')
	@Public()
	public health(@Res() res: Response): void {
		res.status(418).send({ ping: 'Ok!' });
	}
}

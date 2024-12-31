import { Body, Controller, Delete, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthenticationService } from './authentication.service';
import { RegisterRequestDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Public, User } from './decorators';
import { IUserResponse } from '../user/dto/user.response';
import { AuthorizationGuard } from '../role/guards/authorization.guard';
import { IAccessToken, TokenPayload } from './models';
import { map } from 'rxjs';

@Controller('auth')
export class AuthenticationController {
	constructor(private readonly authenticationService: AuthenticationService) {}

	@Public()
	@UseGuards(AuthGuard('local'))
	@Post('login')
	public login(@User() user: IUserResponse) {
		return this.authenticationService.login(user);
	}

	@Public()
	@UseGuards(AuthorizationGuard)
	@Post('register')
	public register(@Body() registerBody: RegisterRequestDto) {
		return this.authenticationService.register(registerBody);
	}

	@Public()
	@Post('refresh')
	public refresh(@Res() res: Response<IAccessToken | { message: string }>, @Body() { grandType, token }: { grandType: string; token: string }) {
		return this.authenticationService
			.refresh(token, grandType)
			.pipe(map((token) => res.status(token ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(token ?? { message: 'Invalid token' })));
	}

	@Delete('logout')
	public logout(@Res() res: Response<unknown>, @User() user: TokenPayload) {
		return this.authenticationService.logout(user.sub).pipe(map(() => res.status(HttpStatus.NO_CONTENT).send()));
	}
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { RegisterRequestDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Public, User } from './decorators';
import { IUserResponse } from '../user/dto/user.response';
import { AuthorizationGuard } from '../role/guards/authorization.guard';

@Public()
@Controller('auth')
export class AuthenticationController {
	constructor(private readonly authenticationService: AuthenticationService) {}

	@UseGuards(AuthGuard('local'))
	@Post('login')
	public login(@User() user: IUserResponse) {
		return this.authenticationService.login(user);
	}

	@UseGuards(AuthorizationGuard)
	@Post('register')
	public register(@Body() registerBody: RegisterRequestDto) {
		return this.authenticationService.register(registerBody);
	}
}

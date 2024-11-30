import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { User } from '../user/entities/user.entity';
import { RegisterRequestDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators';

@Public()
@Controller('auth')
export class AuthenticationController {
	constructor(private readonly authenticationService: AuthenticationService) {}

	@UseGuards(AuthGuard('local'))
	@Post('login')
	public login(@Request() user: User) {
		return this.authenticationService.login(user);
	}

	@Post('register')
	public register(@Body() registerBody: RegisterRequestDto) {
		return this.authenticationService.register(registerBody);
	}
}

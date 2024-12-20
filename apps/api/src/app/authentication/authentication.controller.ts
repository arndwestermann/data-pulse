import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { User as UserEntity } from '../user/entities/user.entity';
import { RegisterRequestDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Public, User } from './decorators';

@Public()
@Controller('auth')
export class AuthenticationController {
	constructor(private readonly authenticationService: AuthenticationService) {}

	@UseGuards(AuthGuard('local'))
	@Post('login')
	public login(@User() user: UserEntity) {
		return this.authenticationService.login(user);
	}

	@Post('register')
	public register(@Body() registerBody: RegisterRequestDto) {
		return this.authenticationService.register(registerBody);
	}
}

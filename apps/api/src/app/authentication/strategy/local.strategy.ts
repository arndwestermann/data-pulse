import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from '../../user/entities/user.entity';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	private readonly logger = new Logger('LocalStrategy');
	constructor(private readonly authService: AuthenticationService) {
		super({
			usernameField: 'username',
		});
	}
	public async validate(username: string, password: string): Promise<User> {
		const user = await this.authService.validate(username, password);
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}
}

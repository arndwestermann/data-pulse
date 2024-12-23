import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { UserService } from '../user/user.service';
import { firstValueFrom, from, Observable, of, switchMap } from 'rxjs';
import { User } from '../user/entities/user.entity';
import { IAccessToken } from './models';
import { RegisterRequestDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { IUserResponse } from '../user/dto/user.response';
import { mapUserToResponse } from '../shared';

@Injectable()
export class AuthenticationService {
	private readonly logger = new Logger('AuthenticationService');
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async validate(username: string, password: string): Promise<IUserResponse> {
		const errorMessage = 'Invalid username or password';
		const user: User = await firstValueFrom(this.userService.findOneByUsername(username, true));
		if (!user) {
			throw new BadRequestException(errorMessage);
		}
		const isMatch = compareSync(password, user.hashedPassword);
		if (!isMatch) {
			throw new BadRequestException(errorMessage);
		}
		return mapUserToResponse(user);
	}

	public login(user: IUserResponse): Observable<IAccessToken> {
		const payload = { username: user.username, email: user.email, roles: user.roles, sub: user.uuid };
		return of({
			accessToken: this.jwtService.sign(payload),
			expiresIn: parseInt(this.configService.getOrThrow<string>('ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC')),
		} satisfies IAccessToken);
	}

	public register(request: RegisterRequestDto): Observable<IAccessToken | string> {
		return this.userService.findOneById(request.username).pipe(
			switchMap((user: User | null) => {
				if (user) return of('ER_DUP_ENTRY');

				return of(request);
			}),
			switchMap((user) => {
				if (typeof user === 'string') return of(user);

				return from(this.userService.create(user));
			}),
			switchMap((user) => {
				if (typeof user === 'string') return of(user);

				return this.login(mapUserToResponse(user));
			}),
		);
	}
}

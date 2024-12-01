import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hash } from 'bcrypt';
import { UserService } from '../user/user.service';
import { firstValueFrom, from, map, Observable, of, switchMap } from 'rxjs';
import { User } from '../user/entities/user.entity';
import { IAccessToken } from './models';
import { RegisterRequestDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthenticationService {
	private readonly logger = new Logger('AuthenticationService');
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async validate(username: string, password: string): Promise<User> {
		const errorMessage = 'Invalid username or password';
		const user: User = await firstValueFrom(this.userService.findOneByUsername(username, true));
		if (!user) {
			throw new BadRequestException(errorMessage);
		}
		const isMatch = compareSync(password, user.hashedPassword);
		if (!isMatch) {
			throw new BadRequestException(errorMessage);
		}
		return user;
	}

	public login(user: User): Observable<IAccessToken> {
		const payload = { username: user.username, email: user.email, sub: user.uuid };
		return of({
			accessToken: this.jwtService.sign(payload),
			expiresIn: parseInt(this.configService.getOrThrow<string>('ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC')),
		} satisfies IAccessToken);
	}

	public register(request: RegisterRequestDto): Observable<IAccessToken | string> {
		return this.userService.findOne(request.username).pipe(
			switchMap((user: User | null) => {
				if (user) return of('ER_DUP_ENTRY');

				return from(hash(request.password, 10)).pipe(
					map((hashedPassword) => ({ email: request.email, password: hashedPassword, username: request.username })),
				);
			}),
			switchMap((user) => {
				if (typeof user === 'string') return of(user);

				return from(this.userService.create(user));
			}),
			switchMap((user) => {
				if (typeof user === 'string') return of(user);

				return this.login(user);
			}),
		);
	}
}

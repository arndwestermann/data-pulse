import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { UserService } from '../user/user.service';
import { firstValueFrom, from, map, Observable, of, switchMap } from 'rxjs';
import { User } from '../user/entities/user.entity';
import { TokenPayload, IAccessToken } from './models';
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
		const user: User | null = await firstValueFrom(this.userService.findOneByUsername(username));
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
		const payload = { sub: user.uuid, roles: user.roles } satisfies Omit<TokenPayload, 'iat' | 'exp'>;

		const accessTokenExpiresIn = parseInt(this.configService.getOrThrow<string>('ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC'));
		const refreshTokenExpiresIn = parseInt(this.configService.getOrThrow<string>('REFRESH_TOKEN_VALIDITY_DURATION_IN_SEC'));
		const accessToken = this.jwtService.sign(payload, {
			secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
			expiresIn: accessTokenExpiresIn,
		});
		const refreshToken = this.jwtService.sign(payload, {
			secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
			expiresIn: refreshTokenExpiresIn,
		});

		return this.userService
			.setRefreshToken(user.uuid, refreshToken)
			.pipe(map(() => ({ accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn }) satisfies IAccessToken));
	}

	public register(request: RegisterRequestDto): Observable<IAccessToken | string> {
		return this.userService.findOneById(request.username).pipe(
			switchMap((user) => {
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

	public refresh(token: string, grandType: string): Observable<IAccessToken | null> {
		return of(this.verify(grandType, token)).pipe(
			switchMap((data) => {
				if (!data.isValid) return this.logout(data.uuid).pipe(map(() => null));

				return this.userService.userHasRefreshToken(data.uuid).pipe(map((hashedToken) => ({ uuid: data.uuid, hashedToken })));
			}),
			map((data) => {
				if (!data?.hashedToken) return null;

				const isMatch = compareSync(token, data.hashedToken);

				return isMatch ? data.uuid : null;
			}),
			switchMap((uuid) => {
				if (!uuid) return of(null);

				return from(this.userService.findOneById(uuid)).pipe(
					switchMap((user) => {
						if (!user) return of(null);

						return this.login(mapUserToResponse(user));
					}),
				);
			}),
		);
	}

	public logout(uuid: string) {
		return this.userService.deleteRefreshTokenById(uuid);
	}

	private verify(grandType: string, token: string): { uuid: string; isValid: boolean } {
		let uuid = '';
		let isValid = false;
		try {
			uuid = this.jwtService.verify<TokenPayload>(token, {
				secret: this.configService.get<string>(grandType === 'accessToken' ? 'JWT_ACCESS_TOKEN_SECRET' : 'JWT_REFRESH_TOKEN_SECRET'),
			}).sub;
			isValid = true;
		} catch (error: unknown) {
			if (error instanceof JsonWebTokenError) {
				uuid = this.jwtService.decode<TokenPayload>(token).sub;

				if (error instanceof TokenExpiredError) this.logger.log(`Token expired for ${uuid} at ${error.expiredAt}`);
				else this.logger.log(error);
			}
		}

		return { uuid, isValid };
	}
}

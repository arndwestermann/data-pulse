/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { catchError, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { hash } from 'bcrypt';
import { RoleService } from '../role/role.service';
import { UserHasRefreshToken } from './entities/user-has-refresh-token.entity';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(UserHasRefreshToken) private readonly userHasRefreshTokenRepository: Repository<UserHasRefreshToken>,
		private readonly roleService: RoleService,
	) {}

	public create({ email, password, username, roles }: CreateUserDto & { roles?: string[] }): Observable<User | string> {
		const roles$ = (roles ?? ['user']).map((role) => this.roleService.findOne(role));

		return forkJoin(roles$).pipe(
			map((roles) => roles.filter((role) => role !== null)),
			switchMap((roles) => from(hash(password, 10)).pipe(map((hash) => ({ hashedPassword: hash, roles })))),
			map(({ hashedPassword, roles }) => {
				const user = new User();
				user.email = email;
				user.hashedPassword = hashedPassword;
				user.username = username;
				user.roles = roles;
				return user;
			}),
			switchMap((user) => from(this.userRepository.save(user))),
			catchError((err: any) => {
				return of(err.code);
			}),
		);
	}

	public findAll(): Observable<User[]> {
		return from(
			this.userRepository.find({ relations: ['roles', 'roles.permissions', 'roles.permissions.action', 'roles.permissions.resource'] }),
		).pipe(map((users) => users.filter((user): user is User => user !== null)));
	}

	public findOneById(uuid: string): Observable<User | null> {
		return from(
			this.userRepository.findOne({
				where: { uuid },
				relations: ['roles', 'roles.permissions', 'roles.permissions.action', 'roles.permissions.resource'],
			}),
		).pipe(
			map((user: User | null) => {
				if (!user) return null;

				return user;
			}),
		);
	}

	public findOneByUsername(username: string): Observable<User | null> {
		return from(
			this.userRepository.findOne({
				where: { username },
				relations: ['roles', 'roles.permissions', 'roles.permissions.action', 'roles.permissions.resource'],
			}),
		).pipe(
			map((user) => {
				if (!user) return null;

				return user;
			}),
		);
	}

	public update(uuid: string, updateUserDto: UpdateUserDto) {
		return this.findOneById(uuid).pipe(
			switchMap((user) => {
				if (updateUserDto.password) {
					return from(hash(updateUserDto.password, 10)).pipe(map((hash) => ({ ...user, hashedPassword: hash })));
				}

				return of(user);
			}),
			switchMap((user) => this.roleService.findAll().pipe(map((roles) => ({ user, roles })))),
			switchMap(({ user, roles }) => {
				if (!user) return of(null);

				if (updateUserDto.username) user.username = updateUserDto.username;
				if (updateUserDto.email) user.email = updateUserDto.email;

				if (updateUserDto.roles) {
					user.roles = roles.filter((role) => updateUserDto.roles?.includes(role.name));
				}

				return from(this.userRepository.save(user));
			}),
		);
	}

	public remove(uuid: string): Observable<string | null> {
		return from(this.userRepository.delete(uuid)).pipe(
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return of(uuid);
				else return of(null);
			}),
		);
	}

	public userHasRefreshToken(uuid: string): Observable<string | null> {
		return from(
			this.userHasRefreshTokenRepository.findOne({
				where: {
					user: uuid,
				},
			}),
		).pipe(map((userHasRefreshToken) => userHasRefreshToken?.token ?? null));
	}

	public setRefreshToken(uuid: string, refreshToken: string): Observable<UserHasRefreshToken | null> {
		return from(hash(refreshToken, 10)).pipe(
			switchMap((hash) => this.findOneById(uuid).pipe(map((user) => ({ user, hash })))),
			switchMap(({ user, hash }) => {
				if (!user) return of(null);
				const userHasRefreshToken = new UserHasRefreshToken();

				userHasRefreshToken.userEntity = user;
				userHasRefreshToken.token = hash;

				return from(this.userHasRefreshTokenRepository.save(userHasRefreshToken));
			}),
		);
	}

	public deleteRefreshTokenById(uuid: string): Observable<unknown> {
		return from(this.userHasRefreshTokenRepository.delete({ userEntity: { uuid } }));
	}

	public deleteRefreshTokenByToken(token: string): Observable<unknown> {
		return from(this.userHasRefreshTokenRepository.delete({ token: token }));
	}
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';

@Injectable()
export class UserService {
	constructor(@InjectRepository(User) private readonly userRepository: Repository<User | null>) {}

	public create({ email, password, username }: CreateUserDto): Observable<User | string> {
		const user = this.userRepository.create({
			email,
			hashedPassword: password,
			username,
		});

		return from(this.userRepository.save(user)).pipe(
			map((user) => {
				delete user.hashedPassword;
				return user;
			}),
			catchError((err: any) => {
				return of(err.code);
			}),
		);
	}

	public findAll(): Observable<User[]> {
		return from(this.userRepository.find()).pipe(
			map((users) =>
				users.map((user) => {
					delete user.hashedPassword;
					return user;
				}),
			),
		);
	}

	public findOneById(uuid: string): Observable<User | null> {
		return from(this.userRepository.findOne({ where: { uuid } })).pipe(
			map((user: User | null) => {
				if (!user) return null;

				delete user.hashedPassword;
				return user;
			}),
		);
	}

	public findOneByUsername(username: string, includePassword = false): Observable<User | null> {
		return from(this.userRepository.findOne({ where: { username } })).pipe(
			map((user: User | null) => {
				if (!user) return null;

				if (includePassword) return user;

				delete user.hashedPassword;
				return user;
			}),
		);
	}

	public update(uuid: string, updateUserDto: UpdateUserDto) {
		return from(this.userRepository.update(uuid, updateUserDto)).pipe(
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return this.findOneById(uuid);

				return of(null);
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
}

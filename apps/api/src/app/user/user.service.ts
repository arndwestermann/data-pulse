import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';

@Injectable()
export class UserService {
	constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

	public create({ email, password, username }: CreateUserDto): Observable<User | { [key: string]: unknown }> {
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
			catchError((err) => {
				return of(err);
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

	public findOne(uuid: string): Observable<User> {
		return from(this.userRepository.findOne({ where: { uuid } })).pipe(
			map((user) => {
				delete user.hashedPassword;
				return user;
			}),
		);
	}

	public update(uuid: string, updateUserDto: UpdateUserDto) {
		return from(this.userRepository.update(uuid, updateUserDto)).pipe(
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return this.findOne(uuid);

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

import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, InternalServerErrorException, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { map } from 'rxjs';
import { mapUserToResponse } from '../shared';
import { Permission } from '../shared/decorators';
import { AuthorizationGuard } from '../role/guards/authorization.guard';
import { IUserResponse } from './dto/user.response';
import { TokenPayload } from '../authentication/models';
import { User } from '../authentication/decorators';

@UseGuards(AuthorizationGuard)
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Permission({ ressource: 'user', actions: ['create'] })
	@Post()
	create(@Body() createUserDto: CreateUserDto) {
		return this.userService.create(createUserDto).pipe(
			map((user) => {
				if (typeof user === 'object') return mapUserToResponse(user);

				switch (user) {
					case 'ER_DUP_ENTRY':
						throw new BadRequestException('User already exists');
					default:
						throw new InternalServerErrorException();
				}
			}),
		);
	}

	@Permission({ ressource: 'user', actions: ['read'] })
	@Get()
	findAll() {
		return this.userService.findAll().pipe(map((users) => users.map((user) => mapUserToResponse(user))));
	}

	@Permission({ ressource: 'user', actions: ['read'] })
	@Get(':uuid')
	findOne(@Param('uuid') uuid: string, @User() user: TokenPayload) {
		const id = uuid === 'me' ? user.sub : uuid;
		return this.userService.findOneById(id).pipe(
			map((user) => {
				if (!user) throw new BadRequestException('User not found');

				return mapUserToResponse(user);
			}),
		);
	}

	@Permission({ ressource: 'user', actions: ['update'], roles: ['admin'] })
	@Patch(':uuid')
	update(@Res() res: Response<IUserResponse>, @Param('uuid') uuid: string, @Body() updateUserDto: UpdateUserDto) {
		return this.userService.update(uuid, updateUserDto).pipe(
			map((user) => {
				if (!user) throw new BadRequestException('User not found');

				return res.status(200).send(mapUserToResponse(user));
			}),
		);
	}

	@Permission({ ressource: 'user', actions: ['delete'] })
	@Delete(':uuid')
	remove(@Res() res: Response<IUserResponse>, @Param('uuid') uuid: string) {
		return this.userService.remove(uuid).pipe(map(() => res.status(201).send()));
	}
}

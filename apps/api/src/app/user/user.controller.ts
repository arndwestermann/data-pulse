import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { map } from 'rxjs';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post()
	create(@Body() createUserDto: CreateUserDto) {
		return this.userService.create(createUserDto).pipe(
			map((value) => {
				if ('uuid' in value) return value;

				switch (value.code) {
					case 'ER_DUP_ENTRY':
						throw new BadRequestException('User already exists');
					default:
						throw new InternalServerErrorException();
				}
			}),
		);
	}

	@Get()
	findAll() {
		return this.userService.findAll();
	}

	@Get(':uuid')
	findOne(@Param('uuid') uuid: string) {
		return this.userService.findOne(uuid).pipe(
			map((value) => {
				if (!value) throw new BadRequestException('User not found');

				return value;
			}),
		);
	}

	@Patch(':uuid')
	update(@Param('uuid') uuid: string, @Body() updateUserDto: UpdateUserDto) {
		return this.userService.update(uuid, updateUserDto);
	}

	@Delete(':uuid')
	remove(@Param('uuid') uuid: string) {
		return this.userService.remove(uuid);
	}
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { mapRoleToResponse } from '../shared';
import { map } from 'rxjs';
import { AuthorizationGuard } from './guards/authorization.guard';
import { Permission } from '../shared/decorators';
import { IRoleResponse } from '../shared/models';

@UseGuards(AuthorizationGuard)
@Controller('role')
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Permission({ ressource: 'role', actions: ['create'] })
	@Post()
	create(@Body() createRoleDto: CreateRoleDto) {
		return this.roleService.create(createRoleDto).pipe(map((role) => mapRoleToResponse(role)));
	}

	@Permission({ ressource: 'role', actions: ['create'] })
	@Post('/permission')
	createPermission(@Body() { role, resource, action }: { role: string; resource: string; action: string }) {
		return this.roleService.addPermission(role, resource, action);
	}

	@Permission({ ressource: 'role', actions: ['delete'] })
	@Post('/permission/delete')
	deletePermission(@Res() res: Response<unknown>, @Body() { role, resource, action }: { role: string; resource: string; action: string }) {
		return this.roleService.deletePermission(role, resource, action).pipe(map(() => res.status(HttpStatus.NO_CONTENT).send()));
	}

	@Permission({ ressource: 'role', actions: ['read'] })
	@Get()
	findAll() {
		return this.roleService.findAll().pipe(map((roles) => roles.map((role) => mapRoleToResponse(role))));
	}

	@Permission({ ressource: 'role', actions: ['read'] })
	@Get(':name')
	findOne(@Res() res: Response<IRoleResponse>, @Param('name') name: string) {
		return this.roleService.findOne(name).pipe(
			map((role) => {
				if (!role) return res.status(HttpStatus.NOT_FOUND).send();

				return res.status(HttpStatus.OK).send(mapRoleToResponse(role));
			}),
		);
	}

	@Permission({ ressource: 'role', actions: ['update'] })
	@Patch(':name')
	update(@Res() res: Response<string>, @Param('name') name: string, @Body() updateRoleDto: UpdateRoleDto) {
		return this.roleService.update(name, updateRoleDto).pipe(map(() => res.status(HttpStatus.NOT_IMPLEMENTED).send())); // map((role) => mapRoleToResponse(role))
	}

	@Permission({ ressource: 'role', actions: ['delete'] })
	@Delete(':name')
	remove(@Res() res: Response<unknown>, @Param('name') name: string) {
		return this.roleService.remove(name).pipe(map(() => res.status(HttpStatus.NO_CONTENT).send()));
	}
}

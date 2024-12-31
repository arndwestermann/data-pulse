import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action, Permission, Resource, Role } from './entities';
import { from, of, Observable, switchMap, map, forkJoin, catchError } from 'rxjs';

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(Role) private readonly roleRepository: Repository<Role>,
		@InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>,
		@InjectRepository(Resource) private readonly resourceRepository: Repository<Resource>,
		@InjectRepository(Action) private readonly actionRepository: Repository<Action>,
	) {}

	public create(createRoleDto: CreateRoleDto): Observable<Role | null> {
		const role = this.roleRepository.create({
			name: createRoleDto.name,
		});

		return from(this.roleRepository.save(role)).pipe(
			switchMap(() =>
				forkJoin([from(this.actionRepository.find()), from(this.resourceRepository.find())]).pipe(
					map(([actions, resources]) => ({ actions, resources })),
				),
			),
			switchMap(({ actions, resources }) => {
				const permission$ = createRoleDto.resources.map((resource) => {
					const permissions = resource.actions.map((action) => {
						const _resource = resources.find((res) => res.name === resource.name);
						const _action = actions.find((act) => act.name === action);

						if (!_resource || !_action) {
							return null;
						}

						return this.createPermission(role, _resource, _action);
					});

					return from(this.permissionRepository.save(permissions.filter((permission) => permission !== null)));
				});

				return permission$.length > 0 ? forkJoin(permission$) : of(null);
			}),
			switchMap(() => this.findOne(createRoleDto.name)),
			catchError((err) => {
				console.error(err);
				return of(err.code);
			}),
		);
	}

	public findAll() {
		return from(
			this.roleRepository.find({
				relations: ['permissions', 'permissions.action', 'permissions.resource', 'permissions.role'],
			}),
		).pipe();
	}

	public findOne(name: string) {
		return from(
			this.roleRepository.findOne({
				where: { name },
				relations: ['permissions', 'permissions.action', 'permissions.resource', 'permissions.role'],
			}),
		);
	}

	public update(_: string, _dto: UpdateRoleDto) {
		return of('Updating role not implemented yet');
		// return forkJoin([this.findOne(name), from(this.resourceRepository.find()), from(this.actionRepository.find())]).pipe(
		// 	switchMap(([role, resources, actions]) => {
		// 		if (!role) return of(null);

		// 		const permissions: Permission[] = [];
		// 		if (dto.resources) {
		// 			dto.resources.forEach((resource) => {
		// 				resource.actions.forEach((action) => {
		// 					const _resource = resources.find((res) => res.name === resource.name);
		// 					const _action = actions.find((act) => act.name === action);
		// 					permissions.push(this.createPermission(role, _resource, _action));
		// 				});
		// 			});
		// 		}

		// 		const updateName$ = dto.name !== name ? from(this.roleRepository.update(name, { name: dto.name })) : of(null);
		// 		const updatePermissions$ = permissions.length > 0 ? from(this.permissionRepository.save(permissions)) : of(null);

		// 		return from(this.permissionRepository.remove(role.permissions)).pipe(
		// 			switchMap(() => from(this.roleRepository.update(name, { name: dto.name }))),
		// 			switchMap(() => updatePermissions$),
		// 			switchMap(() => this.findOne(name)),
		// 		);
		// 	}),
		// );
	}

	public remove(name: string) {
		return from(this.roleRepository.delete(name)).pipe(
			switchMap((value) => {
				if ((value.affected ?? 0) > 0) return of(name);
				else return of(null);
			}),
		);
	}

	public addPermission(role: string, resource: string, action: string) {
		return forkJoin([
			from(this.roleRepository.findOne({ where: { name: role } })),
			from(this.resourceRepository.findOne({ where: { name: resource } })),
			from(this.actionRepository.findOne({ where: { name: action } })),
		]).pipe(
			switchMap(([role, resource, action]) => {
				if (!role || !resource || !action) return of(null);

				return from(this.permissionRepository.save(this.createPermission(role, resource, action)));
			}),
		);
	}

	public deletePermission(role: string, resource: string, action: string) {
		return forkJoin([
			from(this.roleRepository.findOne({ where: { name: role } })),
			from(this.resourceRepository.findOne({ where: { name: resource } })),
			from(this.actionRepository.findOne({ where: { name: action } })),
		]).pipe(
			switchMap(([role, resource, action]) => {
				if (!role || !resource || !action) return of(null);

				return from(this.permissionRepository.delete({ role, resource, action }));
			}),
		);
	}

	private createPermission(role: Role, resource: Resource, action: Action): Permission {
		const permission = new Permission();
		permission.role = role;
		permission.resource = resource;
		permission.action = action;

		return permission;
	}
}

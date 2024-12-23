import { Role } from '../../role/entities';
import { IRoleResponse, IPermissionResponse } from '../models/role.response';

export function mapRoleToResponse(role: Role): IRoleResponse {
	const permissions = role.permissions.reduce<IPermissionResponse>((acc, permission) => {
		const { action, resource } = permission;
		if (!acc[resource.name]) {
			acc[resource.name] = [];
		}

		// Only keep action name
		acc[resource.name].push(action.name);

		return acc;
	}, {});

	return {
		role: role.name,
		permissions,
	};
}

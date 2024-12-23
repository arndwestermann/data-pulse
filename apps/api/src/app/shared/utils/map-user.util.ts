import { IUserResponse } from '../../user/dto/user.response';
import { User } from '../../user/entities/user.entity';
import { mapRoleToResponse } from './map-role.util';

export function mapUserToResponse(user: User): IUserResponse {
	return {
		uuid: user.uuid,
		email: user.email,
		username: user.username,
		roles: user.roles.map((role) => mapRoleToResponse(role)),
	};
}

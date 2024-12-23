import { IRoleResponse } from '../../shared/models/role.response';

export interface IUserResponse {
	uuid: string;
	username: string;
	email: string;
	roles: IRoleResponse[];
}

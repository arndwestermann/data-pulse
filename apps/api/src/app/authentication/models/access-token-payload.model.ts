import { IRoleResponse } from '../../shared/models';

export type AccessTokenPayload = {
	sub: string;
	email: string;
	username: string;
	roles: IRoleResponse[];
	iat: number;
	exp: number;
};

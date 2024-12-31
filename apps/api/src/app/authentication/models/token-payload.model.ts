import { IRoleResponse } from '../../shared/models';

export type TokenPayload = {
	sub: string;
	roles: IRoleResponse[];
	iat: number;
	exp: number;
};

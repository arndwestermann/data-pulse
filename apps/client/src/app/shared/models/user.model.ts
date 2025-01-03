export interface IUser {
	uuid: string;
	email: string;
	username: string;
	roles: Role[];
}

export interface Role {
	role: string;
	permissions: Permissions;
}

export interface Permissions {
	record: string[];
	role: string[];
	user: string[];
}

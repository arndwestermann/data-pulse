export interface IPermissionResponse {
	[key: string]: string[]; // Map of resource name to array of action names
}
export interface IRoleResponse {
	role: string;
	permissions: IPermissionResponse;
}

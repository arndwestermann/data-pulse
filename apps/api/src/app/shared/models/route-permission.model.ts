import { TAction, TResource } from './resource.model';

export interface IRoutePermission {
	ressource: TResource;
	actions: TAction[];
	roles?: string[];
}

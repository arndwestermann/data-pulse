import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRoutePermission, PERMISSIONS_DECORATOR_KEY, TAction } from '../../shared/models';
import { TokenPayload } from '../../authentication/models';
import { Request } from 'express';

@Injectable()
export class AuthorizationGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	public canActivate(context: ExecutionContext) {
		const requiredPermissions = this.reflector.getAllAndOverride<IRoutePermission | undefined>(PERMISSIONS_DECORATOR_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredPermissions) return false;

		const request = context.switchToHttp().getRequest<Request & { user: TokenPayload }>();
		const requestType = request.method;
		const user = request.user;

		const requiredRoles = requiredPermissions.roles ?? [];

		let hasPermission = false;
		let hasRole = false;

		for (const role of user.roles) {
			const resource = role.permissions[requiredPermissions.ressource];
			if (!resource) continue;
			hasPermission = resource.some((permission) => requiredPermissions.actions.includes(permission as TAction));
			hasRole = requiredRoles.some((requiredRole) => requiredRole === role.role);
		}

		if (requestType === 'GET' && request.params.uuid) return hasPermission || hasRole;

		// Find better way to prevent user from overwriting own roles
		if ('roles' in request.body && requestType === 'PATCH') return hasRole;

		if (request.url.includes('user') && requestType === 'PATCH') return (user.sub === request.params.uuid && hasPermission) || hasRole;

		return hasPermission || hasRole;
	}
}

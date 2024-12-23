import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_DECORATOR_KEY } from '../../shared/models';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	public canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_DECORATOR_KEY, [context.getHandler(), context.getClass()]);

		if (isPublic) return true;

		return super.canActivate(context);
	}
}

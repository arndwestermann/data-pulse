import { SetMetadata } from '@nestjs/common';
import { IRoutePermission, PERMISSIONS_DECORATOR_KEY } from '../models';

export const Permission = (permission: IRoutePermission) => SetMetadata(PERMISSIONS_DECORATOR_KEY, permission);

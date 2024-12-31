import { TResource } from '../../shared/models';

export class CreateRoleDto {
	name!: string;
	resources!: ResourceDto[];
}

export class ResourceDto {
	name!: TResource;
	actions!: string[];
}

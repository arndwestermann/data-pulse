import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Action } from './action.entity';
import { Resource } from './resource.entity';
import { Role } from './role.entity';

@Entity({ name: 'permissions' })
export class Permission {
	@PrimaryColumn('varchar')
	@ManyToOne(() => Role, (role) => role.permissions, { cascade: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'role' })
	role: Role;

	@PrimaryColumn('varchar')
	@ManyToOne(() => Resource, (resource) => resource.permissions, { cascade: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'resource' })
	resource: Resource;

	@PrimaryColumn('varchar')
	@ManyToOne(() => Action, (action) => action.permissions, { cascade: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'action' })
	action: Action;
}

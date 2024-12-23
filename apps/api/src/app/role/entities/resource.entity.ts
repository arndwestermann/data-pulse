import { Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity({ name: 'resources' })
export class Resource {
	@PrimaryColumn({ nullable: false, type: 'varchar' })
	name: string;

	@OneToMany(() => Permission, (permission) => permission.resource)
	permissions: Permission[];
}

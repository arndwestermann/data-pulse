import { Entity, ManyToMany, PrimaryColumn, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'roles' })
export class Role {
	@PrimaryColumn({ nullable: false })
	name: string;

	@OneToMany(() => Permission, (permission) => permission.role)
	permissions: Permission[];

	@ManyToMany(() => User, (user) => user.roles, { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
	users: User[];
}

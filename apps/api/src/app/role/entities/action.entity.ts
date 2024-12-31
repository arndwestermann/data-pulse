import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity({ name: 'actions' })
export class Action {
	@PrimaryColumn({ nullable: false })
	name!: string;

	@Column({ nullable: true })
	description?: string;

	@OneToMany(() => Permission, (permission) => permission.action)
	permissions!: Permission[];
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../../role/entities';

@Entity({ name: 'users' })
export class User {
	@PrimaryGeneratedColumn('uuid')
	uuid: string;

	@Column({ unique: true })
	username: string;

	@Column({ unique: true })
	email: string;

	@Column()
	hashedPassword: string;

	@ManyToMany(() => Role, (role) => role.users, { eager: true })
	@JoinTable({
		name: 'user_has_role', // Name of the join table
		joinColumn: { name: 'user', referencedColumnName: 'uuid' },
		inverseJoinColumn: { name: 'role', referencedColumnName: 'name' },
	})
	roles: Role[];
}

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
	@PrimaryGeneratedColumn('uuid')
	uuid: string;

	@Column()
	username: string;

	@Column()
	email: string;

	@Column()
	hashedPassword: string;
}

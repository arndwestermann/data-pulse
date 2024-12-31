import { Entity, Column, PrimaryColumn, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_has_refresh_token' })
export class UserHasRefreshToken {
	@PrimaryColumn({ type: 'uuid' })
	user!: string;

	@OneToOne(() => User, (user) => user.uuid, { cascade: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user' })
	userEntity!: User;

	@Column()
	token!: string;
}

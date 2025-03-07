import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'records' })
export class Record {
	@PrimaryGeneratedColumn('uuid')
	uuid!: string;

	@Column()
	id!: string;

	@Column('datetime')
	arrival!: Date;

	@Column('datetime', { nullable: true })
	leaving!: Date | null;

	@Column()
	from!: string;

	@Column()
	to!: string;

	@Column()
	specialty!: string;

	@ManyToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user' })
	user!: User;
}

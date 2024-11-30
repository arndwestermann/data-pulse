import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Record {
	@PrimaryGeneratedColumn('uuid')
	uuid: string;

	@Column()
	id: string;

	@Column('datetime')
	arrival: Date;

	@Column('datetime')
	leaving: Date;

	@Column()
	from: string;

	@Column()
	to: string;

	@Column()
	specialty: string;

	@Column()
	userUUID: string;
}

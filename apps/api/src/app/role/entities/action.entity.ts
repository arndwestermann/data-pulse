import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

// await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('create', 'Create a new entity')`);
// await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('read', 'Read an existing entity')`);
// await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('update', 'Update an existing entity')`);
// await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('delete', 'Delete an existing entity')`);

@Entity({ name: 'actions' })
export class Action {
	@PrimaryColumn({ nullable: false })
	name: string;

	@Column({ nullable: true })
	description?: string;

	@OneToMany(() => Permission, (permission) => permission.action)
	permissions: Permission[];
}

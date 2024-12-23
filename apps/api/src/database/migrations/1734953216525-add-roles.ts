import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoles1734953216525 implements MigrationInterface {
	name = 'AddRoles1734953216525';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TABLE \`resources\` (\`name\` varchar(255) NOT NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`);
		await queryRunner.query(`CREATE TABLE \`roles\` (\`name\` varchar(255) NOT NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`);
		await queryRunner.query(
			`CREATE TABLE \`permissions\` (\`role\` varchar(255) NOT NULL, \`resource\` varchar(255) NOT NULL, \`action\` varchar(255) NOT NULL, PRIMARY KEY (\`role\`, \`resource\`, \`action\`)) ENGINE=InnoDB`,
		);
		await queryRunner.query(
			`CREATE TABLE \`actions\` (\`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`,
		);
		await queryRunner.query(
			`CREATE TABLE \`user_has_role\` (\`user\` uuid NOT NULL, \`role\` varchar(255) NOT NULL, INDEX \`IDX_d24eae80ee3e33d994ce440f75\` (\`user\`), INDEX \`IDX_9b276e7c04231b966ef717b770\` (\`role\`), PRIMARY KEY (\`user\`, \`role\`)) ENGINE=InnoDB`,
		);
		await queryRunner.query(
			`ALTER TABLE \`permissions\` ADD CONSTRAINT \`FK_ca5274dd57401e6b4b24ff5b155\` FOREIGN KEY (\`role\`) REFERENCES \`roles\`(\`name\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE \`permissions\` ADD CONSTRAINT \`FK_89456a09b598ce8915c702c5283\` FOREIGN KEY (\`resource\`) REFERENCES \`resources\`(\`name\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE \`permissions\` ADD CONSTRAINT \`FK_1c1e0637ecf1f6401beb9a68abe\` FOREIGN KEY (\`action\`) REFERENCES \`actions\`(\`name\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE \`user_has_role\` ADD CONSTRAINT \`FK_d24eae80ee3e33d994ce440f752\` FOREIGN KEY (\`user\`) REFERENCES \`users\`(\`uuid\`) ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE \`user_has_role\` ADD CONSTRAINT \`FK_9b276e7c04231b966ef717b770a\` FOREIGN KEY (\`role\`) REFERENCES \`roles\`(\`name\`) ON DELETE CASCADE ON UPDATE CASCADE`,
		);

		await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('create', 'Create a new entity')`);
		await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('read', 'Read an existing entity')`);
		await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('update', 'Update an existing entity')`);
		await queryRunner.query(`INSERT INTO \`actions\` (\`name\`, \`description\`) VALUES ('delete', 'Delete an existing entity')`);
		await queryRunner.query(`INSERT INTO \`resources\` (\`name\`) VALUES ('user')`);
		await queryRunner.query(`INSERT INTO \`resources\` (\`name\`) VALUES ('record')`);
		await queryRunner.query(`INSERT INTO \`resources\` (\`name\`) VALUES ('role')`);
		await queryRunner.query(`INSERT INTO \`roles\` (\`name\`) VALUES ('admin')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'user', 'create')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'user', 'read')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'user', 'update')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'user', 'delete')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'record', 'create')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'record', 'read')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'record', 'update')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'record', 'delete')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'role', 'create')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'role', 'read')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'role', 'update')`);
		await queryRunner.query(`INSERT INTO \`permissions\` (\`role\`, \`resource\`, \`action\`) VALUES ('admin', 'role', 'delete')`);
		await queryRunner.query(`INSERT INTO \`user_has_role\` (\`user\`, \`role\`) VALUES ('b39f1172-cc46-44fe-97f9-392ce1a8f2f9', 'admin')`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE \`user_has_role\` DROP FOREIGN KEY \`FK_9b276e7c04231b966ef717b770a\``);
		await queryRunner.query(`ALTER TABLE \`user_has_role\` DROP FOREIGN KEY \`FK_d24eae80ee3e33d994ce440f752\``);
		await queryRunner.query(`ALTER TABLE \`permissions\` DROP FOREIGN KEY \`FK_1c1e0637ecf1f6401beb9a68abe\``);
		await queryRunner.query(`ALTER TABLE \`permissions\` DROP FOREIGN KEY \`FK_89456a09b598ce8915c702c5283\``);
		await queryRunner.query(`ALTER TABLE \`permissions\` DROP FOREIGN KEY \`FK_ca5274dd57401e6b4b24ff5b155\``);
		await queryRunner.query(`DROP INDEX \`IDX_9b276e7c04231b966ef717b770\` ON \`user_has_role\``);
		await queryRunner.query(`DROP INDEX \`IDX_d24eae80ee3e33d994ce440f75\` ON \`user_has_role\``);
		await queryRunner.query(`DROP TABLE \`user_has_role\``);
		await queryRunner.query(`DROP TABLE \`actions\``);
		await queryRunner.query(`DROP TABLE \`permissions\``);
		await queryRunner.query(`DROP TABLE \`roles\``);
		await queryRunner.query(`DROP TABLE \`resources\``);
	}
}

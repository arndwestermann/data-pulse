import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inital1733575398505 implements MigrationInterface {
	name = 'Inital1733575398505';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE \`users\` (\`uuid\` uuid NOT NULL, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`hashedPassword\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
		);
		await queryRunner.query(
			`CREATE TABLE \`records\` (\`uuid\` uuid NOT NULL, \`id\` varchar(255) NOT NULL, \`arrival\` datetime NOT NULL, \`leaving\` datetime NOT NULL, \`from\` varchar(255) NOT NULL, \`to\` varchar(255) NOT NULL, \`specialty\` varchar(255) NOT NULL, \`user\` uuid NULL, PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
		);
		await queryRunner.query(
			`ALTER TABLE \`records\` ADD CONSTRAINT \`FK_c8bf05cfadca9c4e15b48be72cb\` FOREIGN KEY (\`user\`) REFERENCES \`users\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`INSERT INTO \`users\` (\`uuid\`, \`username\`, \`email\`, \`hashedPassword\`) VALUES ('b39f1172-cc46-44fe-97f9-392ce1a8f2f9', 'admin', 'admin@data-puls.com', '$2b$10$sKDKegollGdjcv0TC2FRCOP5D7suGLZnKzusiWHQctscYKWB7TUum')`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE \`records\` DROP FOREIGN KEY \`FK_c8bf05cfadca9c4e15b48be72cb\``);
		await queryRunner.query(`DROP TABLE \`records\``);
		await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
		await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
		await queryRunner.query(`DROP TABLE \`users\``);
	}
}

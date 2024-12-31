import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshToken1735649926321 implements MigrationInterface {
    name = 'AddRefreshToken1735649926321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_has_refresh_token\` (\`user\` uuid NOT NULL, \`token\` varchar(255) NOT NULL, PRIMARY KEY (\`user\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_has_refresh_token\` ADD CONSTRAINT \`FK_0b54748e1aab11df55a5f286c13\` FOREIGN KEY (\`user\`) REFERENCES \`users\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_has_refresh_token\` DROP FOREIGN KEY \`FK_0b54748e1aab11df55a5f286c13\``);
        await queryRunner.query(`DROP TABLE \`user_has_refresh_token\``);
    }

}

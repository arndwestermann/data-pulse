import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableLeaving1740577419631 implements MigrationInterface {
    name = 'NullableLeaving1740577419631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`records\` CHANGE \`leaving\` \`leaving\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`records\` CHANGE \`leaving\` \`leaving\` datetime NOT NULL`);
    }

}

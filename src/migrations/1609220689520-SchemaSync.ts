import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaSync1609220689520 implements MigrationInterface {
  name = 'SchemaSync1609220689520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coffee" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "coffee"."description" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "coffee"."description" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "coffee" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByUpdatedByToQuizScoring1762720000000 implements MigrationInterface {
  name = 'AddCreatedByUpdatedByToQuizScoring1762720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add createdBy and updatedBy columns to quiz_scoring table
    await queryRunner.query(`
      ALTER TABLE "quiz_scoring" 
      ADD COLUMN "createdBy" varchar(255) NULL,
      ADD COLUMN "updatedBy" varchar(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove createdBy and updatedBy columns from quiz_scoring table
    await queryRunner.query(`
      ALTER TABLE "quiz_scoring" 
      DROP COLUMN IF EXISTS "createdBy",
      DROP COLUMN IF EXISTS "updatedBy"
    `);
  }
}
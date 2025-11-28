import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGradeAndDetailsToAttempts1733164397000
  implements MigrationInterface
{
  name = 'AddGradeAndDetailsToAttempts1733164397000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add grade column
    await queryRunner.query(`
            ALTER TABLE "attempts" 
            ADD COLUMN "grade" VARCHAR(10)
        `);

    // Add correctAnswers column
    await queryRunner.query(`
            ALTER TABLE "attempts" 
            ADD COLUMN "correctAnswers" INTEGER NOT NULL DEFAULT 0
        `);

    // Add totalQuestions column
    await queryRunner.query(`
            ALTER TABLE "attempts" 
            ADD COLUMN "totalQuestions" INTEGER NOT NULL DEFAULT 0
        `);

    // Update existing attempts to calculate grade and counts if attempt_answers exist
    // Note: Skipping isCorrect check in case the column doesn't exist yet
    await queryRunner.query(`
            UPDATE "attempts" a
            SET 
                "correctAnswers" = COALESCE((
                    SELECT COUNT(*) 
                    FROM "attempt_answers" aa 
                    WHERE aa."attemptId" = a.id
                ), 0),
                "totalQuestions" = COALESCE((
                    SELECT COUNT(*) 
                    FROM "attempt_answers" aa 
                    WHERE aa."attemptId" = a.id
                ), 0),
                "grade" = CASE
                    WHEN a.score >= 90 THEN 'A'
                    WHEN a.score >= 80 THEN 'B'
                    WHEN a.score >= 70 THEN 'C'
                    WHEN a.score >= 60 THEN 'D'
                    ELSE 'F'
                END
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP COLUMN "totalQuestions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP COLUMN "correctAnswers"`,
    );
    await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "grade"`);
  }
}

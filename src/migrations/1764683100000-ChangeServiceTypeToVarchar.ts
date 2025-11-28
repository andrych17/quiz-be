import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeServiceTypeToVarchar1764683100000
  implements MigrationInterface
{
  name = 'ChangeServiceTypeToVarchar1764683100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backup existing data (convert enum values to text)
    // This is safe because we're just changing the column type, not the values

    // Drop index first
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_quiz_serviceType"`,
    );

    // Change serviceType from enum to varchar
    // First, alter the column to text (intermediate step to avoid type mismatch)
    await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ALTER COLUMN "serviceType" TYPE VARCHAR(100) 
            USING "serviceType"::text
        `);

    // Make it nullable to support dynamic values from config
    await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ALTER COLUMN "serviceType" DROP NOT NULL
        `);

    // Recreate index
    await queryRunner.query(`
            CREATE INDEX "IDX_quiz_serviceType" ON "quizzes" ("serviceType")
        `);

    // Drop old enum type (optional, can be kept for rollback safety)
    // await queryRunner.query(`DROP TYPE IF EXISTS "public"."service_type"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop current index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_quiz_serviceType"`,
    );

    // Recreate enum type if it doesn't exist
    await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."service_type" AS ENUM(
                    'service-management',
                    'network-management', 
                    'database-admin',
                    'system-admin',
                    'web-development',
                    'mobile-development',
                    'data-science',
                    'cybersecurity',
                    'cloud-computing',
                    'devops'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

    // Change back to enum (this will fail if there are values not in enum)
    await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ALTER COLUMN "serviceType" TYPE "public"."service_type" 
            USING "serviceType"::text::"public"."service_type"
        `);

    // Make it not null again
    await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ALTER COLUMN "serviceType" SET NOT NULL
        `);

    // Recreate index
    await queryRunner.query(`
            CREATE INDEX "IDX_quiz_serviceType" ON "quizzes" ("serviceType")
        `);
  }
}

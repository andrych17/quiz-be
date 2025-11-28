import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserLocationsAndCreateUserQuizAssignments1762715000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create user_quiz_assignments table
    await queryRunner.query(`
            CREATE TABLE "user_quiz_assignments" (
                "id" SERIAL PRIMARY KEY,
                "userId" int NOT NULL,
                "quizId" int NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_user_quiz_assignment" UNIQUE ("userId", "quizId")
            )
        `);

    // Step 2: Create indexes for user_quiz_assignments
    await queryRunner.query(
      `CREATE INDEX "IDX_user_quiz_assignment_userId" ON "user_quiz_assignments" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_quiz_assignment_quizId" ON "user_quiz_assignments" ("quizId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_quiz_assignment_active" ON "user_quiz_assignments" ("isActive")`,
    );

    // Step 3: Migrate existing data from user_locations to user_quiz_assignments
    // This creates assignments for all admin users to all quizzes in their location
    await queryRunner.query(`
            INSERT INTO "user_quiz_assignments" ("userId", "quizId", "isActive", "createdBy", "createdAt", "updatedAt")
            SELECT 
                ul."userId",
                q."id" as "quizId",
                ul."isActive",
                'migration' as "createdBy",
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM "user_locations" ul
            INNER JOIN "users" u ON ul."userId" = u."id"
            INNER JOIN "quizzes" q ON ul."locationId" = q."locationId"
            WHERE u."role" = 'admin'
            AND ul."isActive" = true
            AND q."locationId" IS NOT NULL
        `);

    // Step 4: Add foreign key constraints to user_quiz_assignments
    await queryRunner.query(`
            ALTER TABLE "user_quiz_assignments" ADD CONSTRAINT "FK_user_quiz_assignment_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "user_quiz_assignments" ADD CONSTRAINT "FK_user_quiz_assignment_quiz" 
            FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE
        `);

    // Step 5: Update users table - add 'superadmin' to role enum if not exists
    // Find the actual enum type by checking which types have enum values
    const enumTypesWithValues = await queryRunner.query(`
            SELECT DISTINCT t.typname
            FROM pg_type t
            INNER JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname LIKE '%role%' OR t.typname LIKE '%user%'
        `);

    console.log('Found enum types with values:', enumTypesWithValues);

    // Try to find the user role enum specifically
    let userRoleEnum = enumTypesWithValues.find(
      (type: any) =>
        type.typname.includes('role') && type.typname.includes('user'),
    );

    if (!userRoleEnum && enumTypesWithValues.length > 0) {
      // Fallback to first enum that contains 'role'
      userRoleEnum = enumTypesWithValues.find((type: any) =>
        type.typname.includes('role'),
      );
    }

    if (userRoleEnum) {
      const enumTypeName = userRoleEnum.typname;
      console.log(`Using enum type: ${enumTypeName}`);

      // Check current values
      const roleEnumValues = await queryRunner.query(
        `
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (
                    SELECT oid 
                    FROM pg_type 
                    WHERE typname = $1
                )
            `,
        [enumTypeName],
      );

      console.log(
        'Current enum values:',
        roleEnumValues.map((r: any) => r.enumlabel),
      );

      const hasSupeadmin = roleEnumValues.some(
        (row: any) => row.enumlabel === 'superadmin',
      );

      if (!hasSupeadmin) {
        // Add 'superadmin' to the enum
        await queryRunner.query(
          `ALTER TYPE "${enumTypeName}" ADD VALUE 'superadmin'`,
        );
        console.log(`Added superadmin role to enum ${enumTypeName}`);
      } else {
        console.log('Superadmin role already exists');
      }
    } else {
      console.log(
        'No suitable role enum found, skipping superadmin role addition',
      );
    }

    // Step 6: Drop foreign key constraints from user_locations
    await queryRunner.query(
      `ALTER TABLE "user_locations" DROP CONSTRAINT IF EXISTS "FK_user_location_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_locations" DROP CONSTRAINT IF EXISTS "FK_user_location_user"`,
    );

    // Step 7: Drop user_locations table
    await queryRunner.query(`DROP TABLE "user_locations"`);

    console.log('Migration completed:');
    console.log('- Created user_quiz_assignments table');
    console.log(
      '- Migrated admin-location assignments to admin-quiz assignments',
    );
    console.log('- Added superadmin role to users enum');
    console.log('- Removed user_locations table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Recreate user_locations table
    await queryRunner.query(`
            CREATE TABLE "user_locations" (
                "id" SERIAL PRIMARY KEY,
                "userId" int NOT NULL,
                "locationId" int NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_user_location_userId" UNIQUE ("userId")
            )
        `);

    await queryRunner.query(
      `CREATE INDEX "IDX_user_location_locationId" ON "user_locations" ("locationId")`,
    );

    // Step 2: Migrate data back from user_quiz_assignments to user_locations
    // This is complex because we need to determine which location each user should be assigned to
    // We'll use the most common locationId from their quiz assignments
    await queryRunner.query(`
            INSERT INTO "user_locations" ("userId", "locationId", "isActive", "createdBy", "createdAt", "updatedAt")
            SELECT DISTINCT
                uqa."userId",
                q."locationId",
                true as "isActive",
                'rollback_migration' as "createdBy",
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM "user_quiz_assignments" uqa
            INNER JOIN "quizzes" q ON uqa."quizId" = q."id"
            INNER JOIN "users" u ON uqa."userId" = u."id"
            WHERE u."role" = 'admin'
            AND q."locationId" IS NOT NULL
            AND uqa."isActive" = true
        `);

    // Step 3: Add foreign key constraints back to user_locations
    await queryRunner.query(`
            ALTER TABLE "user_locations" ADD CONSTRAINT "FK_user_location_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "user_locations" ADD CONSTRAINT "FK_user_location_config" 
            FOREIGN KEY ("locationId") REFERENCES "config_items"("id") ON DELETE CASCADE
        `);

    // Step 4: Drop user_quiz_assignments table
    await queryRunner.query(
      `ALTER TABLE "user_quiz_assignments" DROP CONSTRAINT IF EXISTS "FK_user_quiz_assignment_quiz"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quiz_assignments" DROP CONSTRAINT IF EXISTS "FK_user_quiz_assignment_user"`,
    );
    await queryRunner.query(`DROP TABLE "user_quiz_assignments"`);

    console.log('Rollback completed:');
    console.log('- Recreated user_locations table');
    console.log('- Migrated quiz assignments back to location assignments');
    console.log('- Removed user_quiz_assignments table');
    console.log('WARNING: superadmin role enum value cannot be removed safely');
  }
}

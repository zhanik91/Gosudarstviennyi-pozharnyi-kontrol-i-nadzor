import { Pool } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const REPLIT_DB_URL = process.env.DATABASE_URL;
const SUPABASE_DB_URL = process.env.SUPABASE_DATABASE_URL;

if (!REPLIT_DB_URL || !SUPABASE_DB_URL) {
  console.error("Both DATABASE_URL and SUPABASE_DATABASE_URL must be set");
  process.exit(1);
}

const replitPool = new Pool({ connectionString: REPLIT_DB_URL });
const supabasePool = new Pool({ 
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function getTableColumns(pool: Pool, tableName: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
    [tableName]
  );
  return result.rows.map(r => r.column_name);
}

async function migrateTable(
  tableName: string, 
  transformRow?: (row: any) => any,
  skipExisting?: string
) {
  console.log(`Migrating ${tableName}...`);
  
  try {
    // Get columns from both databases
    const replitColumns = await getTableColumns(replitPool, tableName);
    const supabaseColumns = await getTableColumns(supabasePool, tableName);
    
    // Find common columns
    const commonColumns = replitColumns.filter(c => supabaseColumns.includes(c));
    
    if (commonColumns.length === 0) {
      console.log(`  No common columns found for ${tableName}`);
      return 0;
    }

    const selectQuery = `SELECT ${commonColumns.join(', ')} FROM ${tableName}`;
    const { rows } = await replitPool.query(selectQuery);
    
    if (rows.length === 0) {
      console.log(`  No data in ${tableName}`);
      return 0;
    }

    // Clear existing data in Supabase
    if (skipExisting) {
      await supabasePool.query(`DELETE FROM ${tableName} WHERE ${skipExisting}`);
    } else {
      await supabasePool.query(`DELETE FROM ${tableName}`);
    }

    let migratedCount = 0;
    for (const row of rows) {
      try {
        const transformedRow = transformRow ? transformRow(row) : row;
        
        // Filter only common columns
        const filteredRow: any = {};
        for (const col of commonColumns) {
          if (transformedRow[col] !== undefined) {
            filteredRow[col] = transformedRow[col];
          }
        }
        
        const columns = Object.keys(filteredRow);
        const values = Object.values(filteredRow);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await supabasePool.query(query, values);
        migratedCount++;
      } catch (err: any) {
        if (!err.message.includes('duplicate key')) {
          console.error(`  Error migrating row:`, err.message.substring(0, 100));
        }
      }
    }
    
    console.log(`  Migrated ${migratedCount}/${rows.length} rows (${commonColumns.length} columns)`);
    return migratedCount;
  } catch (err: any) {
    console.error(`  Error with ${tableName}:`, err.message.substring(0, 100));
    return 0;
  }
}

async function main() {
  console.log("Starting migration from Replit to Supabase...\n");

  // Generate common password hash
  const commonPassword = await hashPassword("123456");
  console.log("Generated password hash for users (password: 123456)\n");

  // Migrate org_units first (referenced by users)
  await migrateTable('org_units');

  // Migrate users with new password (skip admin)
  await migrateTable('users', (row) => ({
    ...row,
    password_hash: commonPassword
  }), "username != 'admin'");

  // Migrate main data tables
  await migrateTable('normative_documents');
  await migrateTable('incidents');
  await migrateTable('incident_victims');
  await migrateTable('control_objects');
  await migrateTable('inspections');
  await migrateTable('prescriptions');
  await migrateTable('measures');
  await migrateTable('documents');
  await migrateTable('document_versions');
  await migrateTable('document_tags');
  await migrateTable('document_tag_relations');
  await migrateTable('document_comments');
  await migrateTable('packages');
  await migrateTable('report_forms');
  await migrateTable('audit_logs');
  await migrateTable('notifications');
  await migrateTable('conversations');
  await migrateTable('messages');
  await migrateTable('organizations');
  await migrateTable('organizations_registry');

  console.log("\nMigration completed!");
  console.log("\nAll users now have password: 123456");
  console.log("Admin user password: admin");
  
  await replitPool.end();
  await supabasePool.end();
}

main().catch(console.error);

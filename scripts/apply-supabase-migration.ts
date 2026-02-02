import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: 'postgresql://postgres:AA2711rr%21%21%21@db.qwygjzaulhhrhpsbovjy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(import.meta.dirname, '..', 'migrations', '0001_flimsy_ken_ellis.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());
    
    let success = 0, skipped = 0, errors = 0;
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await client.query(trimmed);
          success++;
        } catch (e: any) {
          if (e.message.includes('already exists') || e.message.includes('duplicate')) {
            skipped++;
          } else {
            errors++;
            console.error('ERROR:', e.message.substring(0, 100));
          }
        }
      }
    }
    console.log(`Migration completed! Success: ${success}, Skipped: ${skipped}, Errors: ${errors}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);

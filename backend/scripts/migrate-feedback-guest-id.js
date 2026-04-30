// backend/scripts/migrate-feedback-guest-id.js
// DB에 이미 삽입된 피드백 데이터의 guest_id를 유효한 UUID v4로 업데이트.
// 실행: node backend/scripts/migrate-feedback-guest-id.js  (프로젝트 루트에서)
//       node scripts/migrate-feedback-guest-id.js          (backend/ 에서)

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const OLD_ID = '00000000-0000-0000-0000-000000000000';
const NEW_ID = '00000000-0000-4000-8000-000000000000';

async function migrate() {
  const client = await pool.connect();
  try {
    const tables = ['projects', 'interview_sessions', 'reports'];
    for (const table of tables) {
      const res = await client.query(
        `UPDATE ${table} SET guest_id = $1 WHERE guest_id = $2`,
        [NEW_ID, OLD_ID]
      );
      console.log(`${table}: ${res.rowCount} row(s) updated`);
    }
    console.log('Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

import pg from 'pg';

const { Pool } = pg;

// ─────────────────────────────────────────
// PostgreSQL 연결 풀
// ─────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,                // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 연결 오류 글로벌 핸들러
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

// ─────────────────────────────────────────
// 기본 쿼리 함수
// ─────────────────────────────────────────
export const query = (text, params) => pool.query(text, params);

// ─────────────────────────────────────────
// RLS 트랜잭션 래퍼
// PRD 15.1: 모든 보호된 쿼리는 이 함수를 통해 실행
//
// 사용법:
//   const result = await withRLS(guestId, async (client) => {
//     return client.query('SELECT * FROM projects');
//   });
// ─────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const withRLS = async (guestId, callback) => {
  if (!UUID_REGEX.test(guestId)) {
    throw new Error(`Invalid guestId format: ${guestId}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // PostgreSQL 세션 변수 설정 — RLS 정책이 이 값을 참조
    // PRD: current_setting('app.current_guest_id')::uuid
    // SET LOCAL은 $1 파라미터 미지원 → UUID 형식 검증으로 injection 방어
    await client.query(
      `SET LOCAL app.current_guest_id = '${guestId}'`
    );

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────
// DB 연결 상태 확인 (헬스체크용)
// ─────────────────────────────────────────
export const checkConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as time');
    return { ok: true, time: result.rows[0].time };
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────
// 피드백 인터뷰용 고정 시드 데이터
// 서버 시작 시 1회 실행, 이미 존재하면 스킵
// ─────────────────────────────────────────
const FEEDBACK_PROJECT_ID    = '00000000-0000-0000-0000-000000000001';
const FEEDBACK_SESSION_ID    = '00000000-0000-0000-0000-000000000002';
const FEEDBACK_QLIST_ID      = '00000000-0000-0000-0000-000000000003';
const FEEDBACK_GUEST_ID      = '00000000-0000-4000-8000-000000000000';

const FEEDBACK_QUESTIONS = {
  icebreakers: [
    {
      section: 'icebreaker',
      text: 'Tell me about your startup. Who are you building for?',
      follow_up_hint: [
        'Can you tell me more about the specific customers you\'re targeting?',
        'What stage is your startup at right now?',
      ],
    },
  ],
  questions: [
    {
      section: 'context',
      text: 'Tell me about the first time you used Nitor8. What did you do?',
      follow_up_hint: [
        'What were you trying to accomplish at that point?',
        'Was that your first time doing a customer development interview?',
      ],
    },
    {
      section: 'problems',
      text: 'Which part of Nitor8 did you use the most? Which part did you not use?',
      follow_up_hint: [
        'Why did you find yourself going back to that part?',
        'Was there a reason you avoided or skipped the other parts?',
      ],
    },
    {
      section: 'problems',
      text: 'Was there a moment you thought this does not work for me? What happened?',
      follow_up_hint: [
        'How did you work around it at the time?',
        'Did that frustration change how you used the tool afterward?',
      ],
    },
    {
      section: 'alternatives',
      text: 'On a scale of 1 to 10, how likely are you to use Nitor8 again next month?',
      follow_up_hint: [
        'What would need to change to make that number higher?',
        'What\'s the main reason you gave that score?',
      ],
    },
    {
      section: 'wtp',
      text: 'What would you pay per month for a tool like this?',
      follow_up_hint: [
        'Is there a pricing model that would work better for you — like pay-per-use instead of monthly?',
        'What are you paying for similar tools right now?',
      ],
    },
    {
      section: 'wtp',
      text: 'What would make it worth that price to you?',
      follow_up_hint: [
        'If you imagine using this daily, what would it need to do?',
        'Is there a specific outcome or result that would justify the price?',
      ],
    },
    {
      section: 'wtp',
      text: 'Can you introduce me to 2 or 3 other founders who might need this?',
      follow_up_hint: [
        'What kind of founders do you think would benefit most from this?',
        'Would you be comfortable making an intro over email or Slack?',
      ],
    },
  ],
};

export const seedFeedbackQuestionList = async () => {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      'SELECT id FROM projects WHERE id = $1',
      [FEEDBACK_PROJECT_ID]
    );
    if (existing.rows.length > 0) {
      console.log('[Seed] Feedback question list already exists — skipping');
      return;
    }

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO projects (id, guest_id, name, created_at)
       VALUES ($1, $2, 'Nitor8 Beta Feedback', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [FEEDBACK_PROJECT_ID, FEEDBACK_GUEST_ID]
    );

    await client.query(
      `INSERT INTO sessions (id, project_id, session_type, input_context, created_at)
       VALUES ($1, $2, 2, '{}', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [FEEDBACK_SESSION_ID, FEEDBACK_PROJECT_ID]
    );

    await client.query(
      `INSERT INTO question_lists (id, session_id, version, questions, title, is_favorite, created_at)
       VALUES ($1, $2, 1, $3, 'Nitor8 Beta Feedback Interview', false, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [FEEDBACK_QLIST_ID, FEEDBACK_SESSION_ID, JSON.stringify(FEEDBACK_QUESTIONS)]
    );

    await client.query('COMMIT');
    console.log('[Seed] Feedback question list created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed] Failed to seed feedback question list:', err.message);
  } finally {
    client.release();
  }
};

export default pool;
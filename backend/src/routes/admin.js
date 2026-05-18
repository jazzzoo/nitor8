// backend/src/routes/admin.js
// 어드민 전용 API — express-basic-auth로 보호
//
// GET /api/admin/feedback-interviews         — 피드백 인터뷰 목록
// GET /api/admin/feedback-interviews/:id/turns — 채팅 로그 전체
// GET /api/admin/feedback-report             — aggregate report 조회

import { Router } from 'express';
import basicAuth from 'express-basic-auth';
import { query, FEEDBACK_QLIST_ID, FEEDBACK_GUEST_ID } from '../models/db.js';
import { generateAggregateReport } from './reports.js';

if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
  console.error('[Admin] FATAL: ADMIN_USER and ADMIN_PASS environment variables must be set');
  process.exit(1);
}

const router = Router();

// ── Basic Auth 미들웨어 ───────────────────────────────────────────
router.use(basicAuth({
  users: {
    [process.env.ADMIN_USER]: process.env.ADMIN_PASS,
  },
  challenge: true,
  realm: 'Nitor8 Admin',
}));

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-interviews
// session_type = 2인 피드백 인터뷰 목록
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-interviews', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         is2.id,
         is2.link_token,
         is2.respondent_name,
         is2.status,
         is2.created_at,
         is2.completed_at,
         ist.current_section,
         ist.completed_sections,
         (SELECT COUNT(*) FROM interview_turns it
          WHERE it.interview_session_id = is2.id AND it.role = 'user') AS response_count
       FROM interview_sessions is2
       JOIN question_lists ql ON is2.question_list_id = ql.id
       JOIN sessions s ON ql.session_id = s.id
       LEFT JOIN interview_state ist ON ist.interview_session_id = is2.id
       WHERE s.session_type = 2
         AND is2.respondent_name NOT IN ('Test User A', 'Test User B')
       ORDER BY is2.created_at DESC`
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Admin] GET /feedback-interviews error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '목록 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-interviews/:id/turns
// 특정 피드백 인터뷰의 채팅 로그 전체
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-interviews/:id/turns', async (req, res) => {
  const { id } = req.params;

  try {
    const sessionCheck = await query(
      `SELECT is2.id
       FROM interview_sessions is2
       JOIN question_lists ql ON is2.question_list_id = ql.id
       JOIN sessions s ON ql.session_id = s.id
       WHERE is2.id = $1 AND s.session_type = 2`,
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '피드백 인터뷰를 찾을 수 없습니다.' },
      });
    }

    const result = await query(
      `SELECT role, content, section, question_index, turn_index, created_at
       FROM interview_turns
       WHERE interview_session_id = $1
       ORDER BY turn_index ASC`,
      [id]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Admin] GET /feedback-interviews/:id/turns error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '채팅 로그 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-report
// 피드백 인터뷰들의 aggregate report
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-report', async (req, res) => {
  try {
    const result = await query(
      `SELECT *
       FROM reports
       WHERE question_list_id = $1
         AND type = 'aggregate'
         AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [FEEDBACK_QLIST_ID]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Admin] GET /feedback-report error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '리포트 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/feedback-regenerate
// 피드백 aggregate 리포트 재생성
// ─────────────────────────────────────────────────────────────────
router.post('/feedback-regenerate', async (req, res) => {
  try {
    const { rows: individualReports } = await query(
      `SELECT r.id, r.result, is2.respondent_name
       FROM reports r
       JOIN interview_sessions is2 ON r.interview_session_id = is2.id
       WHERE is2.question_list_id = $1
         AND (r.type = 'individual' OR r.type IS NULL)
         AND r.status = 'completed'`,
      [FEEDBACK_QLIST_ID]
    );

    if (individualReports.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_DATA', message: '완료된 인터뷰가 2개 이상 필요합니다.' },
      });
    }

    const existing = await query(
      `SELECT id FROM reports WHERE question_list_id = $1 AND type = 'aggregate'`,
      [FEEDBACK_QLIST_ID]
    );

    let aggregateReportId;
    if (existing.rows[0]) {
      aggregateReportId = existing.rows[0].id;
      await query(
        `UPDATE reports SET status = 'generating', result = NULL, completed_at = NULL WHERE id = $1`,
        [aggregateReportId]
      );
    } else {
      const newRow = await query(
        `INSERT INTO reports (guest_id, question_list_id, type, status)
         VALUES ($1, $2, 'aggregate', 'generating')
         RETURNING id`,
        [FEEDBACK_GUEST_ID, FEEDBACK_QLIST_ID]
      );
      aggregateReportId = newRow.rows[0].id;
    }

    res.json({ success: true, data: { id: aggregateReportId, status: 'generating' } });

    generateAggregateReport(aggregateReportId, individualReports, '').catch(console.error);
  } catch (err) {
    console.error('[Admin] POST /feedback-regenerate error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '재생성 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/sessions
// session_type = 1인 고객 인터뷰 세션 목록
// ─────────────────────────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         is2.id,
         is2.link_token,
         is2.respondent_name,
         is2.status,
         is2.created_at,
         is2.completed_at,
         ql.title AS question_list_title,
         (SELECT COUNT(*) FROM interview_turns it
          WHERE it.interview_session_id = is2.id AND it.role = 'user') AS response_count
       FROM interview_sessions is2
       JOIN question_lists ql ON is2.question_list_id = ql.id
       JOIN sessions s ON ql.session_id = s.id
       WHERE s.session_type = 1
         AND (is2.respondent_name IS NULL
              OR is2.respondent_name NOT IN ('Test User A', 'Test User B'))
       ORDER BY is2.created_at DESC
       LIMIT 200`
    );

    const rows = result.rows;
    const completedCount = rows.filter((r) => r.status === 'completed').length;

    return res.json({ success: true, data: rows, meta: { total: rows.length, completed: completedCount } });
  } catch (err) {
    console.error('[Admin] GET /sessions error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '세션 목록 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-summary
// exit_intent_response + intro_feedback 이벤트 집계
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-summary', async (req, res) => {
  try {
    const exitIntentResult = await query(
      `SELECT event_data->>'choice' AS choice, COUNT(*)::int AS count
       FROM analytics_events
       WHERE event_type = 'exit_intent_response'
       GROUP BY event_data->>'choice'
       ORDER BY count DESC`
    );

    const introFeedbackResult = await query(
      `SELECT event_data->>'message' AS message, created_at
       FROM analytics_events
       WHERE event_type = 'intro_feedback'
         AND event_data->>'message' IS NOT NULL
         AND event_data->>'message' <> ''
       ORDER BY created_at DESC
       LIMIT 100`
    );

    return res.json({
      success: true,
      data: {
        exit_intent: exitIntentResult.rows,
        intro_feedback: introFeedbackResult.rows,
      },
    });
  } catch (err) {
    console.error('[Admin] GET /feedback-summary error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '요약 조회 중 오류가 발생했습니다.' },
    });
  }
});

export default router;

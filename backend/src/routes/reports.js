import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { withRLS, query } from '../models/db.js';
import { authenticateGuest } from '../middleware/authenticateGuest.js';

const router = express.Router();
router.use(authenticateGuest);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/reports — guest's report list with respondent_name
router.get('/', async (req, res) => {
  try {
    const rows = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT r.id, r.interview_session_id, r.status, r.created_at, r.completed_at,
                is2.respondent_name, is2.link_token
         FROM reports r
         LEFT JOIN interview_sessions is2 ON r.interview_session_id = is2.id
         WHERE r.guest_id = $1
         ORDER BY r.created_at DESC`,
        [req.guestId]
      );
      return rows;
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[reports] list error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
  }
});

// POST /api/reports/aggregate/:questionListId — 종합 리포트 생성 (or 재생성)
router.post('/aggregate/:questionListId', async (req, res) => {
  const { questionListId } = req.params;
  try {
    const individualReports = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT r.id, r.result, is2.respondent_name
         FROM reports r
         JOIN interview_sessions is2 ON r.interview_session_id = is2.id
         WHERE is2.question_list_id = $1
           AND (r.type = 'individual' OR r.type IS NULL)
           AND r.status = 'completed'
           AND r.guest_id = $2`,
        [questionListId, req.guestId]
      );
      return rows;
    });

    if (individualReports.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_DATA', message: '종합 리포트를 생성하려면 완료된 인터뷰가 2개 이상 필요합니다.' },
      });
    }

    const contextRow = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT s.input_context FROM question_lists ql
         JOIN sessions s ON ql.session_id = s.id
         JOIN projects p ON s.project_id = p.id
         WHERE ql.id = $1 AND p.guest_id = $2`,
        [questionListId, req.guestId]
      );
      return rows[0];
    });
    const businessContext = contextRow?.input_context?.business_summary || '';

    const existingRow = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT id FROM reports WHERE question_list_id = $1 AND type = 'aggregate' AND guest_id = $2`,
        [questionListId, req.guestId]
      );
      return rows[0];
    });

    let aggregateReportId;
    if (existingRow) {
      aggregateReportId = existingRow.id;
      await withRLS(req.guestId, async (client) => {
        await client.query(
          `UPDATE reports SET status = 'generating', result = NULL, completed_at = NULL
           WHERE id = $1`,
          [aggregateReportId]
        );
      });
    } else {
      const newRow = await withRLS(req.guestId, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO reports (guest_id, question_list_id, type, status)
           VALUES ($1, $2, 'aggregate', 'generating')
           RETURNING id`,
          [req.guestId, questionListId]
        );
        return rows[0];
      });
      aggregateReportId = newRow.id;
    }

    res.json({ success: true, data: { id: aggregateReportId, status: 'generating' } });

    generateAggregateReport(aggregateReportId, individualReports, businessContext).catch(console.error);
  } catch (err) {
    console.error('[reports] aggregate POST error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
  }
});

// GET /api/reports/aggregate/:questionListId — 종합 리포트 조회
router.get('/aggregate/:questionListId', async (req, res) => {
  const { questionListId } = req.params;
  try {
    const row = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT id, status, created_at, completed_at,
                CASE WHEN status = 'completed' THEN result ELSE NULL END AS result
         FROM reports
         WHERE question_list_id = $1 AND type = 'aggregate' AND guest_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [questionListId, req.guestId]
      );
      return rows[0] || null;
    });
    if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '종합 리포트가 없습니다.' } });
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('[reports] aggregate GET error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
  }
});

// POST /api/reports/regenerate/:sessionId — 개별 리포트 재생성
router.post('/regenerate/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const sessionRow = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT is2.id, is2.status, s.input_context
         FROM interview_sessions is2
         JOIN question_lists ql ON is2.question_list_id = ql.id
         JOIN sessions s ON ql.session_id = s.id
         WHERE is2.id = $1 AND is2.guest_id = $2`,
        [sessionId, req.guestId]
      );
      return rows[0];
    });

    if (!sessionRow) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '인터뷰 세션을 찾을 수 없습니다.' },
      });
    }

    if (sessionRow.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: { code: 'INTERVIEW_NOT_COMPLETED', message: '완료된 인터뷰만 리포트를 재생성할 수 있습니다.' },
      });
    }

    await withRLS(req.guestId, async (client) => {
      await client.query(
        `UPDATE reports SET status = 'generating', result = NULL, completed_at = NULL
         WHERE interview_session_id = $1 AND guest_id = $2`,
        [sessionId, req.guestId]
      );
    });

    res.json({ success: true, data: { status: 'generating' } });

    const businessContext = sessionRow.input_context?.business_summary || '';
    generateIndividualReport(sessionId, businessContext).catch(console.error);
  } catch (err) {
    console.error('[reports] regenerate POST error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
  }
});

// GET /api/reports/:id/status — polling endpoint
router.get('/:id/status', async (req, res) => {
  try {
    const row = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT status, updated_at FROM reports WHERE id = $1 AND guest_id = $2`,
        [req.params.id, req.guestId]
      );
      return rows[0] || null;
    });
    if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '리포트를 찾을 수 없습니다.' } });
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('[reports] status error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
  }
});

// GET /api/reports/:id — single report detail
router.get('/:id', async (req, res) => {
  try {
    const row = await withRLS(req.guestId, async (client) => {
      const { rows } = await client.query(
        `SELECT r.id, r.interview_session_id, r.status, r.created_at, r.completed_at,
                CASE WHEN r.status = 'completed' THEN r.result ELSE NULL END AS result,
                is2.respondent_name, is2.link_token
         FROM reports r
         LEFT JOIN interview_sessions is2 ON r.interview_session_id = is2.id
         WHERE r.id = $1 AND r.guest_id = $2`,
        [req.params.id, req.guestId]
      );
      return rows[0] || null;
    });
    if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '리포트를 찾을 수 없습니다.' } });
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('[reports] detail error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
  }
});

export default router;

// ── 개별 리포트 생성 (백그라운드) ────────────────────────────────
async function generateIndividualReport(interviewSessionId, businessContext) {
  try {
    await query(
      `UPDATE reports SET status = 'generating' WHERE interview_session_id = $1`,
      [interviewSessionId]
    );

    const turns = await query(
      `SELECT role, content, section FROM interview_turns
       WHERE interview_session_id = $1
       ORDER BY turn_index ASC`,
      [interviewSessionId]
    );

    const transcript = turns.rows
      .map((t) => `${t.role === 'assistant' ? 'Nitor' : 'Respondent'} [${t.section}]: ${t.content}`)
      .join('\n\n');

    const systemPrompt = `You are an expert Lean Customer Development analyst trained in the Mom Test and Jobs-to-be-Done frameworks.
This is a Session 1 Problem Interview transcript. Your job is to extract only what is evidenced in the transcript.

LANGUAGE RULE: Detect the language of the business_context field. Output the entire report in that same language. Never mix languages.

OUTPUT: Respond with ONLY valid JSON. No markdown, no explanation, no text outside the JSON.

JSON SCHEMA:
{
  "problem_verdict": {
    "status": "confirmed" | "mixed" | "rejected",
    "evidence_level": "strong" | "medium" | "weak",
    "reason": "1-2 sentence justification citing specific transcript evidence"
  },
  "respondent_context": {
    "role": "respondent's role or job title as described in transcript",
    "segment_fit": "high" | "medium" | "low",
    "context_summary": "2-3 sentences describing the context in which they experience this problem"
  },
  "problem_situations": [
    {
      "trigger": "the specific situation or event that triggers the problem",
      "job_context": "what the respondent was trying to accomplish at that moment",
      "quote": "exact quote if available, otherwise empty string"
    }
  ],
  "top_pains": [
    {
      "title": "pain label",
      "description": "what exactly goes wrong",
      "impact": "concrete cost: time / money / stress / delay",
      "frequency": "how often this occurs, based on what they said",
      "quote": "exact words from respondent, or empty string if none"
    }
  ],
  "current_workarounds": [
    {
      "method": "what they currently do to cope",
      "why_used": "why they chose this approach",
      "complaint": "limitation or frustration with this approach"
    }
  ],
  "consequences": [
    {
      "type": "time" | "stress" | "quality" | "money" | "delay",
      "detail": "specific loss or consequence described",
      "quote": "exact quote if available, otherwise empty string"
    }
  ],
  "evidence_quotes": [
    "most revealing quote 1",
    "most revealing quote 2",
    "most revealing quote 3"
  ],
  "next_actions": ["action 1", "action 2", "action 3"],
  "next_questions": ["question 1", "question 2", "question 3"],
  "decision_block": {
    "verdict": "confirmed" | "mixed" | "rejected",
    "confidence": "high" | "medium" | "low",
    "recommended_move": "continue" | "narrow_icp" | "pivot" | "move_to_solution"
  }
}

RULES:
1. SESSION SCOPE: This is a Problem Interview only. Do NOT extract or infer anything about solutions, features, pricing, willingness-to-pay, or product ideas.
2. EVIDENCE ONLY: Extract only past behaviors, recent specific events, actual workarounds, and concrete losses described by the respondent.
3. QUOTES: Every key judgment must be backed by an exact quote. If no quote exists for a field, use empty string "".
4. evidence_level: strong = specific incident + workaround + measurable consequence all present; medium = some elements; weak = only vague mentions.
5. segment_fit: high = problem is frequent, severe, respondent has already tried to solve it; medium = problem exists but severity/frequency low; low = problem absent or minor.
6. top_pains: max 3. current_workarounds: max 3. consequences: max 3. evidence_quotes: max 3. problem_situations: max 3.
7. HALLUCINATION PREVENTION: If the transcript does not contain evidence for a field, output empty string "" or empty array [].`;

    let result = null;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: process.env.AI_MODEL_FALLBACK || 'claude-sonnet-4-6-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `Business context: ${businessContext}\n\nInterview transcript:\n${transcript}`,
          }],
        });

        const rawText = response.content[0].text;
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        result = JSON.parse(cleaned);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[reports] individual attempt ${attempt + 1} failed:`, err.message);
      }
    }

    if (result) {
      await query(
        `UPDATE reports SET status = 'completed', result = $1, completed_at = NOW()
         WHERE interview_session_id = $2`,
        [JSON.stringify(result), interviewSessionId]
      );
      console.log(`[reports] individual report regenerated: ${interviewSessionId}`);
    } else {
      await query(`UPDATE reports SET status = 'failed' WHERE interview_session_id = $1`, [interviewSessionId]);
      console.error(`[reports] individual failed after 3 attempts:`, lastError?.message);
    }
  } catch (err) {
    console.error(`[reports] individual unexpected error:`, err.message);
    await query(`UPDATE reports SET status = 'failed' WHERE interview_session_id = $1`, [interviewSessionId]).catch(() => {});
  }
}

// ── 종합 리포트 생성 (백그라운드) ────────────────────────────────
export async function generateAggregateReport(reportId, individualReports, businessContext) {
  const N = individualReports.length;

  const systemPrompt = `You are an expert customer development analyst trained in the Mom Test and Jobs-to-be-Done frameworks.
You will receive ${N} individual Problem Interview reports and must produce a single aggregate synthesis report.

LANGUAGE RULE: Detect the language of the business_context field. Output the entire report in that same language.

OUTPUT: Respond with ONLY valid JSON. No markdown, no explanation, no text outside the JSON.

JSON SCHEMA:
{
  "overall_verdict": {
    "status": "confirmed" | "mixed" | "rejected",
    "evidence_level": "strong" | "medium" | "weak",
    "reason": "2-3 sentence synthesis citing patterns across interviews"
  },
  "respondent_count": ${N},
  "pattern_summary": "2-3 sentence overview of the most consistent patterns found across all interviews",
  "recurring_pains": [
    {
      "title": "pain label",
      "frequency": "N/${N} respondents",
      "description": "what exactly goes wrong, synthesized across interviews",
      "representative_quote": "most illustrative quote from any respondent, or empty string"
    }
  ],
  "common_workarounds": [
    {
      "method": "what multiple respondents currently do to cope",
      "frequency": "N/${N} respondents",
      "complaint": "shared limitation or frustration"
    }
  ],
  "segment_insights": "Any differences found between respondent segments, roles, or contexts. Empty string if no meaningful differences.",
  "key_evidence_quotes": ["most revealing quote 1", "most revealing quote 2", "most revealing quote 3"],
  "next_actions": ["action 1", "action 2", "action 3"],
  "open_questions": ["unresolved question 1", "unresolved question 2", "unresolved question 3"],
  "decision_recommendation": "continue" | "narrow_icp" | "pivot" | "move_to_solution"
}

RULES:
1. Only include pains and workarounds that appear in 2+ interviews. Single-respondent patterns go in segment_insights.
2. frequency must be accurate (e.g. "3/${N} respondents").
3. decision_recommendation meanings: continue=keep interviewing same segment, narrow_icp=problem confirmed but segment too broad, pivot=problem not validated, move_to_solution=strong signal ready for solution interviews.
4. recurring_pains: max 4, ranked by frequency then severity. common_workarounds: max 3. key_evidence_quotes: exactly 3 best quotes.
5. HALLUCINATION PREVENTION: Only synthesize what is evidenced in the provided reports.`;

  try {
    const userContent = `Business context: ${businessContext}

Number of interviews: ${N}

Individual interview reports:
${individualReports.map((r, i) =>
  `--- Interview ${i + 1} (${r.respondent_name || 'Anonymous'}) ---\n${JSON.stringify(r.result)}`
).join('\n\n')}

Generate aggregate synthesis report.`;

    let result = null;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: process.env.AI_MODEL_FALLBACK || 'claude-sonnet-4-6-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        });

        const rawText = response.content[0].text;
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        result = JSON.parse(cleaned);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[reports] aggregate attempt ${attempt + 1} failed:`, err.message);
      }
    }

    if (result) {
      await query(
        `UPDATE reports SET status = 'completed', result = $1, completed_at = NOW() WHERE id = $2`,
        [JSON.stringify(result), reportId]
      );
      console.log(`[reports] aggregate report generated: ${reportId}`);
    } else {
      await query(`UPDATE reports SET status = 'failed' WHERE id = $1`, [reportId]);
      console.error(`[reports] aggregate failed after 3 attempts:`, lastError?.message);
    }
  } catch (err) {
    console.error(`[reports] aggregate unexpected error:`, err.message);
    await query(`UPDATE reports SET status = 'failed' WHERE id = $1`, [reportId]).catch(() => {});
  }
}

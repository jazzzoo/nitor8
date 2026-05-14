// frontend/src/screens/IntroScreen.js

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import GradientButton from '../components/GradientButton';
import useStore from '../store/useStore';
import { colors, spacing, radius } from '../theme';

const MOBILE_BP = 700;
const MAX_W     = 1100;

// ─────────────────────────────────────────────────────────────────
// Chat Mockup
// ─────────────────────────────────────────────────────────────────
const CHAT_MESSAGES = [
  { role: 'nitor', text: "Hi Sarah! Before we dive in, could you tell me what you do for work and where you're based?" },
  { role: 'user',  text: "I'm a product manager at a B2B SaaS company in New York." },
  { role: 'nitor', text: "Could you tell me about a specific time this caused a real problem?" },
  { role: 'user',  text: "Last quarter we delayed a launch by 3 weeks because..." },
];

function ChatMockup({ style }) {
  return (
    <View style={[mock.chatBox, style]}>
      <View style={mock.chatHeader}>
        <View style={mock.statusDot} />
        <Text style={mock.chatTitle}>Nitor8 · Interview</Text>
      </View>
      {CHAT_MESSAGES.map((m, i) => (
        <View key={i} style={m.role === 'user' ? { alignItems: 'flex-end' } : null}>
          <View style={m.role === 'nitor' ? mock.nitorBubble : mock.userBubble}>
            {m.role === 'nitor' && <Text style={mock.senderLabel}>Nitor</Text>}
            <Text style={m.role === 'nitor' ? mock.nitorText : mock.userText}>{m.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Report Card Mockup (compact, hero overlay)
// ─────────────────────────────────────────────────────────────────
function ReportCardMockup({ style }) {
  return (
    <View style={[mock.reportCard, style]}>
      <View style={mock.infoRow}>
        <Text style={mock.infoLabel}>Problem Verdict</Text>
        <Text style={mock.verdictText}>✅ Confirmed</Text>
      </View>
      <View style={mock.infoRow}>
        <Text style={mock.infoLabel}>Evidence Level</Text>
        <Text style={mock.evidenceText}>High</Text>
      </View>
      <View style={mock.sep} />
      <Text style={mock.infoLabel}>Top Pain</Text>
      <Text style={mock.painQuote}>"Never know if they understood"</Text>
      <Text style={mock.painMeta}>— 3 of 5 respondents</Text>
      <View style={mock.sep} />
      <Text style={mock.infoLabel}>Next Action</Text>
      <Text style={mock.actionLine}>→ Focus on async features</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full Report Mockup (section 4)
// ─────────────────────────────────────────────────────────────────
function FullReportMockup() {
  return (
    <View style={mock.fullReport}>
      <View style={mock.infoRow}>
        <Text style={mock.infoLabel}>Problem Verdict</Text>
        <Text style={mock.verdictText}>✅ Confirmed</Text>
      </View>
      <View style={mock.infoRow}>
        <Text style={mock.infoLabel}>Evidence Level</Text>
        <Text style={mock.evidenceText}>High</Text>
      </View>
      <View style={mock.sep} />
      <Text style={mock.groupHead}>Top Pain Points</Text>
      {[
        { quote: '"Never know if they understood"', meta: '— 3 of 5 respondents' },
        { body: 'Communication delays causing project setbacks' },
        { body: 'Cultural context lost in translation' },
      ].map((p, i) => (
        <View key={i} style={mock.painRow}>
          <Text style={mock.painIdx}>{i + 1}.</Text>
          <View style={{ flex: 1 }}>
            {p.quote && <Text style={mock.painQuote}>{p.quote}</Text>}
            {p.meta  && <Text style={mock.painMeta}>{p.meta}</Text>}
            {p.body  && <Text style={mock.painBody}>{p.body}</Text>}
          </View>
        </View>
      ))}
      <View style={mock.sep} />
      <Text style={mock.groupHead}>Current Workarounds</Text>
      {['Hiring local project managers', 'Over-documenting everything', 'Extra review calls weekly'].map((w, i) => (
        <Text key={i} style={mock.bulletLine}>· {w}</Text>
      ))}
      <View style={mock.sep} />
      <Text style={mock.groupHead}>Next Actions</Text>
      {['Focus on async communication features', 'Build status visibility dashboard', 'Interview 3 more ops managers'].map((a, i) => (
        <Text key={i} style={mock.actionLine}>→ {a}</Text>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// FAQ data
// ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Do my customers need to speak English?",    a: "Yes. Nitor8 is designed for founders who want to interview English-speaking customers in US/UK markets." },
  { q: "What language can I use?",                  a: "Any language. You describe your product in your own language. The report comes back in your language too." },
  { q: "Do I need an account?",                     a: "No. Start your first interview without signing up. Free during beta." },
  { q: "How long does an interview take?",          a: "About 10–15 minutes for your customer. You just share a link." },
  { q: "What if my customer gives short answers?",  a: "Nitor8 handles it. The AI follows up, probes deeper, and knows when to move on." },
];

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function IntroScreen({ navigation }) {
  const { width }    = useWindowDimensions();
  const isDesktop    = width >= MOBILE_BP;
  const setNavTitle  = useStore((s) => s.setNavTitle);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [openFaq, setOpenFaq]             = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (typeof document !== 'undefined') document.title = 'Nitor8';
      setNavTitle('');
    }, [])
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      navigation.navigate('Admin');
      return;
    }
    const seen = typeof localStorage !== 'undefined'
      ? localStorage.getItem('nitor8-beta-notice')
      : null;
    if (!seen) setShowBetaModal(true);
  }, []);

  function dismissBetaModal() {
    if (typeof localStorage !== 'undefined') localStorage.setItem('nitor8-beta-notice', 'true');
    setShowBetaModal(false);
  }

  function handleCTA() { navigation.navigate('Create'); }

  function BetaModal() {
    if (!showBetaModal) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: colors.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: colors.surface, borderRadius: radius.lg, maxWidth: 520, width: '100%', padding: 40, minHeight: 400 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>BETA</p>
          <div>
            <p style={{ fontSize: 18, color: colors.textSecondary, marginBottom: 8, fontWeight: 400 }}>Welcome to</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <img src="/logodark.png" style={{ width: '65%', height: 'auto' }} alt="Nitor8" />
              <span style={{ fontSize: 18, fontWeight: 400, color: colors.textSecondary }}>Beta</span>
            </div>
          </div>
          <ul style={{ paddingLeft: 20, color: colors.textSecondary, fontSize: 18, lineHeight: '30px', marginTop: 24, marginBottom: 20 }}>
            <li>This is a beta version — features may change.</li>
            <li>Currently supports Session 1 (Problem Interview) only.</li>
            <li>Use the same browser &amp; device for best experience.</li>
            <li>Questions or feedback? <a href="https://x.com/nitor8_hq" style={{ color: colors.primary }}>@nitor8_hq on X</a></li>
          </ul>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
            <button onClick={dismissBetaModal} style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryMid}, ${colors.primaryEnd})`, color: colors.white, border: 'none', borderRadius: radius.md, padding: '12px 24px', fontSize: 19, fontWeight: 600, cursor: 'pointer', width: '40%' }}>Got it →</button>
          </div>
        </div>
      </div>
    );
  }

  const secPad = isDesktop ? 80 : 48;

  return (
    <>
      {typeof document !== 'undefined' && <BetaModal />}
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── 1. HERO ─────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: secPad, paddingBottom: secPad }}>
            <View style={{
              maxWidth: MAX_W, width: '100%', alignSelf: 'center',
              flexDirection: isDesktop ? 'row' : 'column',
              gap: spacing.xxl,
              alignItems: isDesktop ? 'center' : 'flex-start',
            }}>
              {/* Left */}
              <View style={{ flex: 1 }}>
                <Text style={lp.eyebrow}>AI customer interviews for non-English founders</Text>
                <Text style={[lp.heroH, { fontSize: isDesktop ? 42 : 30, lineHeight: isDesktop ? 52 : 40 }]}>
                  Your customers speak English.{'\n'}You don't have to.
                </Text>
                <Text style={lp.heroSub}>
                  Describe your product in your own language. Nitor8 runs the customer interview in English and gives you a Lean-style report back in your language.
                </Text>
                <GradientButton
                  label="Start your first interview →"
                  onPress={handleCTA}
                  style={{ alignSelf: 'flex-start', marginTop: spacing.lg }}
                />
                <Text style={lp.trust}>No account needed · Free beta</Text>
              </View>

              {/* Right: overlapping mockups */}
              <View style={{ flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%', marginTop: isDesktop ? 0 : spacing.xl }}>
                {isDesktop ? (
                  <View style={{ height: 370, position: 'relative' }}>
                    <ChatMockup style={{ position: 'absolute', top: 0, left: 0, right: 32, zIndex: 1 }} />
                    <ReportCardMockup style={{ position: 'absolute', bottom: 0, right: 0, width: 220, zIndex: 2 }} />
                  </View>
                ) : (
                  <View style={{ gap: spacing.md }}>
                    <ChatMockup />
                    <ReportCardMockup />
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={lp.divider} />

          {/* ── 2. PROBLEM ──────────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad }}>
            <View style={{
              maxWidth: MAX_W, width: '100%', alignSelf: 'center',
              flexDirection: isDesktop ? 'row' : 'column',
              gap: spacing.xxl,
            }}>
              {/* Left */}
              <View style={{ flex: 1 }}>
                <Text style={lp.eyebrow}>Sound familiar?</Text>
                <Text style={lp.headline}>
                  You know you should talk to customers.{'\n'}But live English calls are a different story.
                </Text>
                <Text style={lp.body}>
                  Every startup book says the same thing.{'\n'}Talk to your customers.{'\n\n'}But for non-English founders, that advice hides a very real blocker.
                </Text>
              </View>

              {/* Right: bullets */}
              <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg, marginTop: isDesktop ? 0 : spacing.xl }}>
                {[
                  'Follow-up questions in real time',
                  'Reading between the lines',
                  'Knowing when to push deeper',
                  'Not freezing mid-conversation',
                ].map((txt, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryEnd, marginTop: 9, flexShrink: 0 }} />
                    <Text style={{ fontSize: 18, color: colors.textSecondary, lineHeight: 28, flex: 1 }}>{txt}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom emphasis */}
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center', marginTop: spacing.xxl }}>
              <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryEnd, paddingLeft: spacing.lg }}>
                <Text style={{ fontSize: isDesktop ? 21 : 17, fontStyle: 'italic', color: colors.textSecondary, lineHeight: isDesktop ? 32 : 26 }}>
                  "So you delay. And delay. Until you realize you've built without really talking to anyone."
                </Text>
              </View>
            </View>
          </View>

          <View style={lp.divider} />

          {/* ── 3. HOW IT WORKS ─────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad, backgroundColor: colors.surface }}>
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>
              <Text style={lp.eyebrow}>Simple by design</Text>
              <Text style={lp.headline}>Three steps. No English required.</Text>

              <View style={{ marginTop: spacing.xxl, gap: spacing.xxl }}>
                {[
                  { num: '01', title: 'Describe', body: 'Write about your product in your own language. Nitor8 generates Lean-style interview questions.' },
                  { num: '02', title: 'Share',    body: 'Send an interview link to your target customer. Nitor8 handles the full English conversation for you.' },
                  { num: '03', title: 'Learn',    body: 'Get a structured Lean-style report back in your language. Problem verdict, key pains, quotes, next actions.' },
                ].map((step, i) => (
                  <View key={i} style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.xl, alignItems: 'flex-start' }}>
                    <View style={{ width: 52, height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1.5 }}>{step.num}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
                        Step {i + 1} — {step.title}
                      </Text>
                      <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26 }}>{step.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={lp.divider} />

          {/* ── 4. REPORT PREVIEW ───────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad }}>
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>
              <Text style={lp.eyebrow}>What you actually get</Text>
              <Text style={lp.headline}>Not just a transcript. A decision.</Text>
              <Text style={lp.body}>
                Every interview generates a structured Lean-style report so you know exactly what to do next.
              </Text>

              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.xxl, marginTop: spacing.xxl, alignItems: isDesktop ? 'flex-start' : 'stretch' }}>
                <View style={{ flex: isDesktop ? 1.4 : 1 }}>
                  <FullReportMockup />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md, marginTop: isDesktop ? 0 : spacing.lg }}>
                  {['Problem Verdict', 'Evidence Level', 'Top 3 Pain Points with quotes', 'Current Workarounds', 'Consequences', 'Next Actions'].map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text style={{ fontSize: 16, color: colors.success, fontWeight: '700' }}>✓</Text>
                      <Text style={{ fontSize: 17, color: colors.textSecondary }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={lp.divider} />

          {/* ── 5. WHY NITOR8 ───────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad, backgroundColor: colors.surface }}>
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>
              <Text style={lp.eyebrow}>Built for founders like you</Text>
              <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryMid, paddingLeft: spacing.lg, marginBottom: spacing.xxl }}>
                <Text style={{ fontSize: isDesktop ? 21 : 17, fontStyle: 'italic', color: colors.textSecondary, lineHeight: isDesktop ? 32 : 26 }}>
                  "The alternative wasn't better interviews. It was zero interviews."
                </Text>
              </View>

              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.xxl }}>
                {[
                  { title: 'Not a translation tool',       body: "Nitor8 doesn't just translate. It runs the full interview — questions, follow-ups, and all." },
                  { title: 'Lean methodology built in',    body: 'Every interview follows proven Lean Customer Development. Not generic questions. Real signal.' },
                  { title: '8 interviews is enough',       body: 'Focused validation, not endless interviewing. Nitor8 is built around that belief.' },
                ].map((item, i) => (
                  <View key={i} style={{ flex: 1, borderTopWidth: 2, borderTopColor: colors.border, paddingTop: spacing.lg }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm }}>{item.title}</Text>
                    <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26 }}>{item.body}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={lp.divider} />

          {/* ── 6. FAQ ──────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad }}>
            <View style={{ maxWidth: isDesktop ? 720 : MAX_W, width: '100%', alignSelf: 'center' }}>
              <Text style={lp.eyebrow}>Questions</Text>
              <Text style={lp.headline}>FAQ</Text>

              <View style={{ marginTop: spacing.lg }}>
                {FAQ_ITEMS.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setOpenFaq(openFaq === i ? null : i)}
                    activeOpacity={0.7}
                    style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary, flex: 1, paddingRight: spacing.md }}>{item.q}</Text>
                      <Text style={{ fontSize: 22, color: colors.textDisabled, lineHeight: 26 }}>{openFaq === i ? '−' : '+'}</Text>
                    </View>
                    {openFaq === i && (
                      <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26, marginTop: spacing.sm }}>{item.a}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={lp.divider} />

          {/* ── 7. FINAL CTA ────────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: isDesktop ? 96 : 64, alignItems: 'center' }}>
            <View style={{ maxWidth: 600, width: '100%', alignItems: 'center' }}>
              <Text style={[lp.headline, { textAlign: 'center' }]}>
                Your first 8 interviews start here.
              </Text>
              <Text style={[lp.body, { textAlign: 'center', marginTop: spacing.sm }]}>
                Free during beta. No account needed.{'\n'}Just describe your product and go.
              </Text>
              <GradientButton
                label="Start your first interview →"
                onPress={handleCTA}
                style={{ marginTop: spacing.xl, minWidth: 280 }}
              />
              <Text style={[lp.trust, { marginTop: spacing.md, textAlign: 'center' }]}>
                Free beta · No credit card needed
              </Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Landing page styles
// ─────────────────────────────────────────────────────────────────
const lp = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDisabled,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroH: {
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: spacing.md,
  },
  heroSub: {
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 30,
  },
  trust: {
    fontSize: 13,
    color: colors.textDisabled,
    marginTop: spacing.sm,
  },
  headline: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 17,
    color: colors.textSecondary,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

// ─────────────────────────────────────────────────────────────────
// Mockup styles
// ─────────────────────────────────────────────────────────────────
const mock = StyleSheet.create({
  chatBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  chatTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDisabled,
    letterSpacing: 0.5,
  },
  nitorBubble: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderTopLeftRadius: 4,
    padding: spacing.sm,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    borderBottomRightRadius: 4,
    padding: spacing.sm,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDisabled,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nitorText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  userText: {
    fontSize: 13,
    color: colors.white,
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fullReport: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textDisabled,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryEnd,
  },
  sep: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  groupHead: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  painRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  painIdx: {
    fontSize: 12,
    color: colors.textDisabled,
    fontWeight: '600',
    width: 18,
  },
  painQuote: {
    fontSize: 12,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  painMeta: {
    fontSize: 10,
    color: colors.textDisabled,
  },
  painBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  bulletLine: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionLine: {
    fontSize: 12,
    color: colors.primaryEnd,
    lineHeight: 20,
  },
});

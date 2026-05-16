// frontend/src/screens/IntroScreen.js

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { AlarmClock, EyeOff, Shovel, MessageCircleX, BookOpenCheck, Link, FileChartColumn } from 'lucide-react-native';

import GradientButton from '../components/GradientButton';
import useStore from '../store/useStore';
import { colors, spacing, radius } from '../theme';

const MOBILE_BP = 700;
const MAX_W     = 1100;
const GRAD      = ['#A8BAD9', '#E0B7C6', '#FF8A80'];

// ─────────────────────────────────────────────────────────────────
// Scroll animation wrapper (web only via IntersectionObserver)
// ─────────────────────────────────────────────────────────────────
function AnimatedSection({ children, delay = 0, style }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`;
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        } else {
          el.style.opacity = '0';
          el.style.transform = 'translateY(40px)';
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return <View ref={ref} style={style}>{children}</View>;
}

// ─────────────────────────────────────────────────────────────────
// Gradient headline text
// ─────────────────────────────────────────────────────────────────
function GradientText({ children, style }) {
  if (Platform.OS === 'web') {
    return (
      <Text style={[style, {
        backgroundImage: `linear-gradient(90deg, ${GRAD[0]}, ${GRAD[1]}, ${GRAD[2]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }]}>
        {children}
      </Text>
    );
  }
  return <Text style={[style, { color: colors.primary }]}>{children}</Text>;
}

// ─────────────────────────────────────────────────────────────────
// Neumorphic card
// ─────────────────────────────────────────────────────────────────
function NeuCard({ children, style }) {
  return (
    <View style={[{
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    }, style]}>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Smartphone frame mockup (Hero)
// ─────────────────────────────────────────────────────────────────
function PhoneFrame() {
  const shadowStyle = Platform.OS === 'web'
    ? { boxShadow: '0 24px 70px rgba(0,0,0,0.28), 0 6px 20px rgba(0,0,0,0.18)' }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 24, elevation: 16 };

  return (
    <View style={[{
      width: 280,
      backgroundColor: '#1a1a2e',
      borderRadius: 44,
      padding: 14,
      borderWidth: 2,
      borderColor: '#333',
    }, shadowStyle]}>
      {/* Screen */}
      <View style={{ backgroundColor: colors.background, borderRadius: 30, overflow: 'hidden', height: 532 }}>
        {/* Notch */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 20, paddingTop: 15 }}>
          <View style={{ width: 60, height: 16, backgroundColor: '#1a1a2e', borderRadius: 8 }} />
        </View>

        {/* Chat UI */}
        <View style={{ flex: 1, padding: 16, paddingTop: 44 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 10 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>Nitor</Text>
          </View>

          {/* Nitor bubble */}
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, borderTopLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14, maxWidth: '88%', marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textDisabled, letterSpacing: 0.5, marginBottom: 3 }}>Nitor</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
              {"Hi Sarah! Before we dive in, could you tell me what you do for work and where you're based?"}
            </Text>
          </View>

          {/* Sarah bubble */}
          <View style={{ alignSelf: 'flex-end', backgroundColor: colors.primary, borderRadius: radius.md, borderBottomRightRadius: 4, paddingVertical: 10, paddingHorizontal: 14, maxWidth: '88%', marginBottom: 10 }}>
            <Text style={{ fontSize: 15, color: colors.white, lineHeight: 22 }}>
              {"I'm a product manager at a B2B SaaS in New York."}
            </Text>
          </View>

          {/* Nitor bubble */}
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, borderTopLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14, maxWidth: '88%' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textDisabled, letterSpacing: 0.5, marginBottom: 3 }}>Nitor</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
              {"Tell me about a time this caused a real problem?"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hero report card (overlaps phone frame) — full report structure
// ─────────────────────────────────────────────────────────────────
function HeroReportCard({ style }) {
  const sectionLabel = { fontSize: 10, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.xs };
  const sectionWrap  = { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginBottom: spacing.sm };

  return (
    <NeuCard style={[{ width: 300, padding: 0, overflow: 'hidden' }, style]}>
      <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>

        {/* Badge row */}
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.xs }}>
          <View style={{ backgroundColor: 'rgba(102,187,106,0.15)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>✅ Problem Confirmed</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(168,186,217,0.2)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>High Evidence</Text>
          </View>
        </View>

        {/* Respondent context */}
        <Text style={{ fontSize: 11, color: colors.textDisabled, marginBottom: spacing.sm }}>
          Product Manager · B2B SaaS · New York
        </Text>

        {/* Top Pains */}
        <View style={sectionWrap}>
          <Text style={sectionLabel}>Top Pains</Text>
          {[
            { title: 'Communication clarity gap',           quote: 'I never know if they actually understood what I need', freq: 'High'   },
            { title: 'Project delays from miscommunication', quote: 'We delayed our launch by 3 weeks',                    freq: 'Medium' },
          ].map((pain, i) => (
            <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryEnd, backgroundColor: colors.surface, borderRadius: radius.sm, paddingLeft: 12, paddingRight: spacing.sm, paddingVertical: spacing.sm, marginBottom: spacing.xs }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>{pain.title}</Text>
              <Text style={{ fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 16, marginBottom: 4 }}>"{pain.quote}"</Text>
              <Text style={{ fontSize: 10, color: colors.textDisabled }}>● {pain.freq} frequency</Text>
            </View>
          ))}
        </View>

        {/* Current Workarounds */}
        <View style={sectionWrap}>
          <Text style={sectionLabel}>Current Workarounds</Text>
          {['Hiring local project managers', 'Over-documenting requirements', 'Extra weekly review calls'].map((w, i) => (
            <Text key={i} style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 20 }}>· {w}</Text>
          ))}
        </View>

        {/* Consequences */}
        <View style={sectionWrap}>
          <Text style={sectionLabel}>Consequences</Text>
          {['Launch delays averaging 2-3 weeks', 'Budget overruns from rework'].map((c, i) => (
            <Text key={i} style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 20 }}>· {c}</Text>
          ))}
        </View>

        {/* Evidence Quotes */}
        <View style={sectionWrap}>
          <Text style={sectionLabel}>Evidence Quotes</Text>
          <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryMid, paddingLeft: 10 }}>
            <Text style={{ fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 17 }}>
              "They say yes but mean maybe. It took us months to figure that out."
            </Text>
          </View>
        </View>

        {/* Next Actions */}
        <View style={sectionWrap}>
          <Text style={sectionLabel}>Next Actions</Text>
          {[
            'Focus on async communication clarity',
            'Build status visibility dashboard',
            'Interview 3 more ops managers',
          ].map((a, i) => (
            <Text key={i} style={{ fontSize: 12, color: colors.primary, lineHeight: 20 }}>→ {a}</Text>
          ))}
        </View>

      </ScrollView>
    </NeuCard>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full Mock Report (section 4)
// ─────────────────────────────────────────────────────────────────
const SAMPLE_REPORT = {
  problem_verdict:    'confirmed',
  evidence_level:     'high',
  respondent_context: 'Product Manager at B2B SaaS, New York',
  top_pains: [
    { title: 'Communication clarity gap',           quote: 'I never know if they actually understood what I need',  frequency: 'high'   },
    { title: 'Project delays from miscommunication', quote: 'Last quarter we delayed a launch by 3 weeks',           frequency: 'medium' },
    { title: 'Cultural context lost in handoffs',    quote: 'They say yes but mean maybe',                           frequency: 'medium' },
  ],
  current_workarounds: [
    'Hiring local project managers',
    'Over-documenting every requirement',
    'Scheduling extra review calls weekly',
  ],
  evidence_quotes: [
    'I never know if they actually understood what I need, or if they are just saying yes to be polite.',
    'We ended up redoing the entire feature because the brief was misunderstood from day one.',
  ],
  next_actions: [
    'Focus messaging on async communication clarity',
    'Build status visibility as core feature',
    'Interview 3 more ops managers next week',
  ],
};

function RVerdictBadge({ status }) {
  const cfg = {
    confirmed: { bg: '#E8F5E9', color: '#2E7D32', label: 'Confirmed' },
    mixed:     { bg: '#FFF8E1', color: '#F57F17', label: 'Mixed'     },
    rejected:  { bg: '#FFEBEE', color: '#C62828', label: 'Rejected'  },
  };
  const c = cfg[status] || cfg.mixed;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.color }}>✓ {c.label}</Text>
    </View>
  );
}

function RFreqBadge({ freq }) {
  const high = freq === 'high';
  return (
    <View style={{ backgroundColor: high ? '#E8F5E9' : '#FFF8E1', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: high ? '#2E7D32' : '#F57F17' }}>{freq}</Text>
    </View>
  );
}

function RSection({ title, children }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function MockReport() {
  return (
    <NeuCard style={{ padding: 0, overflow: 'hidden' }}>
      <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Interview Report</Text>
            <Text style={{ fontSize: 12, color: colors.textDisabled, marginTop: 2 }}>{SAMPLE_REPORT.respondent_context}</Text>
          </View>
          <RVerdictBadge status={SAMPLE_REPORT.problem_verdict} />
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.md }} />

        {/* Evidence Level */}
        <RSection title="Evidence Level">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
              <View style={{ width: '88%', height: '100%', borderRadius: 3, backgroundColor: colors.success }} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.success }}>High</Text>
          </View>
        </RSection>

        {/* Top Pain Points */}
        <RSection title="Top Pain Points">
          {SAMPLE_REPORT.top_pains.map((pain, i) => (
            <View key={i} style={{
              borderLeftWidth: 3, borderLeftColor: colors.primaryEnd,
              paddingLeft: spacing.md, paddingVertical: spacing.sm,
              marginBottom: spacing.sm, backgroundColor: colors.background,
              borderRadius: radius.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: spacing.sm }}>{pain.title}</Text>
                <RFreqBadge freq={pain.frequency} />
              </View>
              <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 18 }}>"{pain.quote}"</Text>
            </View>
          ))}
        </RSection>

        {/* Current Workarounds */}
        <RSection title="Current Workarounds">
          {SAMPLE_REPORT.current_workarounds.map((w, i) => (
            <View key={i} style={{
              borderLeftWidth: 3, borderLeftColor: colors.primary,
              paddingLeft: spacing.md, paddingVertical: spacing.xs,
              marginBottom: spacing.xs, backgroundColor: colors.background,
              borderRadius: radius.sm,
            }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{w}</Text>
            </View>
          ))}
        </RSection>

        {/* Evidence Quotes */}
        <RSection title="Evidence Quotes">
          {SAMPLE_REPORT.evidence_quotes.map((q, i) => (
            <View key={i} style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 18 }}>"{q}"</Text>
            </View>
          ))}
        </RSection>

        {/* Next Actions */}
        <RSection title="Next Actions">
          {SAMPLE_REPORT.next_actions.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Text style={{ fontSize: 12, color: colors.primaryEnd, fontWeight: '700' }}>→</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 18 }}>{a}</Text>
            </View>
          ))}
        </RSection>

      </ScrollView>
    </NeuCard>
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
  const { width, height } = useWindowDimensions();
  const isDesktop   = width >= MOBILE_BP;
  const setNavTitle = useStore((s) => s.setNavTitle);
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

  const secPad = isDesktop ? 96 : 60;

  const desktopEyebrowStyle = {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.primary,
    textTransform: 'uppercase',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  };

  const headlineStyle = (iD) => ({
    fontSize: iD ? 44 : 32,
    lineHeight: iD ? 54 : 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  });

  return (
    <>
      {typeof document !== 'undefined' && <BetaModal />}
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── 1. HERO ─────────────────────────────────────────── */}
          <AnimatedSection style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.lg,
            paddingTop: secPad,
            paddingBottom: secPad,
            minHeight: isDesktop ? height : undefined,
            justifyContent: isDesktop ? 'center' : undefined,
          }}>
            <View style={[
              { width: '100%', maxWidth: 1400, alignSelf: 'center' },
              isDesktop
                ? { position: 'relative' }
                : { flexDirection: 'column', gap: spacing.xxl, alignItems: 'flex-start', maxWidth: MAX_W },
            ]}>
              {/* Left */}
              <View style={isDesktop ? { paddingRight: '45%', zIndex: 2 } : {}}>
                {isDesktop ? (
                  <AnimatedSection delay={0}>
                    <Text style={desktopEyebrowStyle}>AI customer interviews for non-English founders</Text>
                  </AnimatedSection>
                ) : (
                  <Text style={lp.eyebrow}>AI customer interviews for non-English founders</Text>
                )}
                <GradientText style={{
                  fontSize: isDesktop ? 72 : 36,
                  lineHeight: isDesktop ? 75 : 46,
                  fontWeight: '900',
                  letterSpacing: isDesktop ? -2 : -1.5,
                  marginBottom: isDesktop ? spacing.xxl * 1.5 : spacing.md,
                  color: colors.textPrimary,
                }}>
                  Your customers speak English.{'\n'}You don't have to.
                </GradientText>
                <Text style={[lp.heroSub, isDesktop && {
                  fontSize: 22,
                  lineHeight: 35,
                  marginBottom: spacing.xxl,
                }]}>
                  {'Describe your product in your own language.\nNitor8 runs the customer interview in English and gives you a Lean-style report back in your language.'}
                </Text>
                <GradientButton
                  label="Start your first interview →"
                  onPress={handleCTA}
                  style={{ alignSelf: 'flex-start', marginTop: isDesktop ? spacing.xxl : spacing.lg }}
                />
                <Text style={[lp.trust, isDesktop && {
                  marginTop: spacing.lg,
                  fontSize: 16,
                  color: colors.textSecondary,
                }]}>No account needed · Free beta</Text>
              </View>

              {/* Right: phone frame + report card */}
              {isDesktop ? (
                <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', zIndex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <PhoneFrame />
                    <HeroReportCard style={{ marginLeft: -20, marginTop: 50 }} />
                  </View>
                </View>
              ) : (
                <View style={{ gap: spacing.md, alignItems: 'center', width: '100%', marginTop: spacing.xl }}>
                  <PhoneFrame />
                  <HeroReportCard />
                </View>
              )}
            </View>
          </AnimatedSection>

          {/* ── 2. PROBLEM ──────────────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad }}>
            {isDesktop ? (
              /* Desktop: single column, full width */
              <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center', gap: spacing.xxl }}>
                {/* Header */}
                <View>
                  <AnimatedSection delay={0}>
                    <Text style={desktopEyebrowStyle}>Sound familiar?</Text>
                  </AnimatedSection>
                  <AnimatedSection delay={0.15}>
                    <GradientText style={headlineStyle(true)}>
                      You know you should talk to customers.{'\n'}But live English calls are a different story.
                    </GradientText>
                  </AnimatedSection>
                  <Text style={lp.body}>
                    Every startup book says the same thing.{'\n'}Talk to your customers.{'\n\n'}But for non-English founders, that advice hides a very real blocker.
                  </Text>
                </View>

                {/* Quote */}
                <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryEnd, paddingLeft: spacing.lg }}>
                  <Text style={{ fontSize: 21, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 32 }}>
                    "So you delay. And delay. Until you realize you've built without really talking to anyone."
                  </Text>
                </View>

                {/* Bullets — 4-column horizontal */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                  {[
                    { Icon: AlarmClock,     text: 'Follow-up questions in real time' },
                    { Icon: EyeOff,         text: 'Reading between the lines' },
                    { Icon: Shovel,         text: 'Knowing when to push deeper' },
                    { Icon: MessageCircleX, text: 'Not freezing mid-conversation' },
                  ].map(({ Icon, text }, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                      <View style={[{
                        width: 64, height: 64,
                        backgroundColor: colors.primaryEnd,
                        borderRadius: radius.md,
                        padding: spacing.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }, Platform.OS === 'web'
                        ? { boxShadow: '0 8px 24px rgba(255,138,128,0.35)' }
                        : { shadowColor: colors.primaryEnd, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }
                      ]}>
                        <Icon size={32} color={colors.white} />
                      </View>
                      <Text style={{ marginTop: spacing.sm, textAlign: 'center', fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* Mobile: keep existing 2-step layout */
              <>
                <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center', gap: spacing.xxl }}>
                  <View style={{ flex: 1 }}>
                    <Text style={lp.eyebrow}>Sound familiar?</Text>
                    <GradientText style={headlineStyle(false)}>
                      You know you should talk to customers.{'\n'}But live English calls are a different story.
                    </GradientText>
                    <Text style={lp.body}>
                      Every startup book says the same thing.{'\n'}Talk to your customers.{'\n\n'}But for non-English founders, that advice hides a very real blocker.
                    </Text>
                  </View>
                  <View style={{ marginTop: spacing.xl }}>
                    <NeuCard>
                      <View style={{ gap: spacing.lg }}>
                        {[
                          { Icon: AlarmClock,     text: 'Follow-up questions in real time' },
                          { Icon: EyeOff,         text: 'Reading between the lines' },
                          { Icon: Shovel,         text: 'Knowing when to push deeper' },
                          { Icon: MessageCircleX, text: 'Not freezing mid-conversation' },
                        ].map(({ Icon, text }, i) => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                            <Icon size={24} color={colors.error} style={{ flexShrink: 0 }} />
                            <Text style={{ fontSize: 18, color: colors.textSecondary, lineHeight: 28, flex: 1 }}>{text}</Text>
                          </View>
                        ))}
                      </View>
                    </NeuCard>
                  </View>
                </View>
                <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center', marginTop: spacing.xxl }}>
                  <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryEnd, paddingLeft: spacing.lg }}>
                    <Text style={{ fontSize: 17, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 26 }}>
                      "So you delay. And delay. Until you realize you've built without really talking to anyone."
                    </Text>
                  </View>
                </View>
              </>
            )}
          </AnimatedSection>

          {/* ── 3. HOW IT WORKS ─────────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad, backgroundColor: colors.surface }}>
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>
              {isDesktop
                ? <AnimatedSection delay={0}><Text style={desktopEyebrowStyle}>Simple by design</Text></AnimatedSection>
                : <Text style={lp.eyebrow}>Simple by design</Text>
              }
              {isDesktop
                ? <AnimatedSection delay={0.15}><GradientText style={headlineStyle(isDesktop)}>Three steps. No English required.</GradientText></AnimatedSection>
                : <GradientText style={headlineStyle(isDesktop)}>Three steps. No English required.</GradientText>
              }

              <View style={{ marginTop: spacing.xxl, gap: spacing.xl }}>
                {[
                  { Icon: BookOpenCheck,   title: 'Describe', body: 'Write about your product in your own language. Nitor8 generates Lean-style interview questions.' },
                  { Icon: Link,            title: 'Share',    body: 'Send an interview link to your target customer. Nitor8 handles the full English conversation for you.' },
                  { Icon: FileChartColumn, title: 'Learn',    body: 'Get a structured Lean-style report back in your language. Problem verdict, key pains, quotes, next actions.' },
                ].map(({ Icon, title, body }, i) => (
                  <NeuCard key={i}>
                    <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.xl, alignItems: 'flex-start' }}>
                      {/* Gradient border box */}
                      <View style={Platform.OS === 'web' ? {
                        width: 56, height: 56, borderRadius: radius.md,
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        borderWidth: 1,
                        borderColor: 'transparent',
                        backgroundImage: `linear-gradient(${colors.surface}, ${colors.surface}), linear-gradient(135deg, ${colors.primary}, ${colors.primaryEnd})`,
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box',
                        backgroundColor: colors.surface,
                      } : {
                        width: 56, height: 56, borderRadius: radius.md,
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                      }}>
                        <Icon size={28} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs }}>
                          {title}
                        </Text>
                        <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26 }}>{body}</Text>
                      </View>
                    </View>
                  </NeuCard>
                ))}
              </View>
            </View>
          </AnimatedSection>

          {/* ── 4. REPORT PREVIEW ───────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad }}>
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>
              {isDesktop
                ? <AnimatedSection delay={0}><Text style={desktopEyebrowStyle}>What you actually get</Text></AnimatedSection>
                : <Text style={lp.eyebrow}>What you actually get</Text>
              }
              {isDesktop
                ? <AnimatedSection delay={0.15}><GradientText style={headlineStyle(isDesktop)}>Not just a transcript. A decision.</GradientText></AnimatedSection>
                : <GradientText style={headlineStyle(isDesktop)}>Not just a transcript. A decision.</GradientText>
              }
              <Text style={lp.body}>
                Every interview generates a structured Lean-style report so you know exactly what to do next.
              </Text>

              <View style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: spacing.xxl,
                marginTop: spacing.xxl,
                alignItems: isDesktop ? 'flex-start' : 'stretch',
              }}>
                <View style={{ flex: isDesktop ? 1.4 : 1 }}>
                  <MockReport />
                </View>
                {isDesktop ? (
                  <View style={{ flex: 1, alignSelf: 'stretch', paddingTop: spacing.xl, paddingBottom: spacing.xl, justifyContent: 'space-between' }}>
                    {['Problem Verdict', 'Evidence Level', 'Top 3 Pain Points with quotes', 'Current Workarounds', 'Consequences', 'Next Actions'].map((label, i) => (
                      <AnimatedSection key={i} delay={i * 0.1}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}>
                          <Text style={{ fontSize: 20, color: colors.white, fontWeight: '700' }}>✓</Text>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.white }}>{label}</Text>
                        </View>
                      </AnimatedSection>
                    ))}
                  </View>
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg }}>
                    {['Problem Verdict', 'Evidence Level', 'Top 3 Pain Points with quotes', 'Current Workarounds', 'Consequences', 'Next Actions'].map((item, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text style={{ fontSize: 16, color: colors.success, fontWeight: '700' }}>✓</Text>
                        <Text style={{ fontSize: 17, color: colors.textSecondary }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </AnimatedSection>

          {/* ── 5. WHY NITOR8 ───────────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad, backgroundColor: colors.surface }}>
            <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>
              {isDesktop
                ? <AnimatedSection delay={0}><Text style={desktopEyebrowStyle}>Built for founders like you</Text></AnimatedSection>
                : <Text style={lp.eyebrow}>Built for founders like you</Text>
              }
              <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryMid, paddingLeft: spacing.lg, marginBottom: spacing.xxl }}>
                <Text style={{ fontSize: isDesktop ? 21 : 17, fontStyle: 'italic', color: colors.textSecondary, lineHeight: isDesktop ? 32 : 26 }}>
                  "The alternative wasn't better interviews. It was zero interviews."
                </Text>
              </View>

              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.xl }}>
                {[
                  { title: 'Not a translation tool',    body: "Nitor8 doesn't just translate. It runs the full interview — questions, follow-ups, and all." },
                  { title: 'Lean methodology built in', body: 'Every interview follows proven Lean Customer Development. Not generic questions. Real signal.' },
                  { title: '8 interviews is enough',    body: 'Focused validation, not endless interviewing. Nitor8 is built around that belief.' },
                ].map((item, i) => (
                  <NeuCard key={i} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm }}>{item.title}</Text>
                    <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26 }}>{item.body}</Text>
                  </NeuCard>
                ))}
              </View>
            </View>
          </AnimatedSection>

          {/* ── 6. FAQ ──────────────────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{ paddingHorizontal: spacing.lg, paddingVertical: secPad }}>
            <View style={{ maxWidth: isDesktop ? 720 : MAX_W, width: '100%', alignSelf: 'center' }}>
              {isDesktop
                ? <AnimatedSection delay={0}><Text style={desktopEyebrowStyle}>Questions</Text></AnimatedSection>
                : <Text style={lp.eyebrow}>Questions</Text>
              }
              {isDesktop
                ? <AnimatedSection delay={0.15}><GradientText style={headlineStyle(isDesktop)}>FAQ</GradientText></AnimatedSection>
                : <GradientText style={headlineStyle(isDesktop)}>FAQ</GradientText>
              }

              <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                {FAQ_ITEMS.map((item, i) => (
                  <NeuCard key={i} style={{ padding: 0 }}>
                    <TouchableOpacity
                      onPress={() => setOpenFaq(openFaq === i ? null : i)}
                      activeOpacity={0.7}
                      style={{ padding: spacing.md }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary, flex: 1, paddingRight: spacing.md }}>{item.q}</Text>
                        <Text style={{ fontSize: 22, color: colors.textDisabled, lineHeight: 26 }}>{openFaq === i ? '−' : '+'}</Text>
                      </View>
                      {openFaq === i && (
                        <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26, marginTop: spacing.sm }}>{item.a}</Text>
                      )}
                    </TouchableOpacity>
                  </NeuCard>
                ))}
              </View>
            </View>
          </AnimatedSection>

          {/* ── 7. FINAL CTA ────────────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{ paddingHorizontal: spacing.lg, paddingVertical: isDesktop ? 96 : 64, alignItems: 'center' }}>
            <View style={{ maxWidth: 600, width: '100%', alignItems: 'center' }}>
              <GradientText style={[headlineStyle(isDesktop), { textAlign: 'center' }]}>
                Your first 8 interviews start here.
              </GradientText>
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
          </AnimatedSection>

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
  body: {
    fontSize: 17,
    color: colors.textSecondary,
    lineHeight: 28,
  },
});


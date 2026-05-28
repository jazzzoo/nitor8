// frontend/src/screens/IntroScreen.js

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Platform, View, Text, ScrollView, TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import GradientButton from '../components/GradientButton';
import LogoMark from '../components/LogoMark';
import useStore from '../store/useStore';
import { colors, spacing, radius } from '../theme';

const MOBILE_BP = 700;
const MAX_W     = 1100;
const API_BASE  = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// Scroll-in animation (web only via IntersectionObserver)
// ─────────────────────────────────────────────────────────────────
function AnimatedSection({ children, delay = 0, style }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `opacity 0.55s ease-out ${delay}s, transform 0.55s ease-out ${delay}s`;
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
          el.style.transform = 'translateY(28px)';
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
// Gradient headline
// ─────────────────────────────────────────────────────────────────
function GradientText({ children, style }) {
  if (Platform.OS === 'web') {
    return (
      <Text style={[style, {
        backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryMid}, ${colors.primaryEnd})`,
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
// Surface card
// ─────────────────────────────────────────────────────────────────
function SurfaceCard({ children, style }) {
  return (
    <View style={[{
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    }, style]}>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Screenshot placeholder (빈 박스)
// ─────────────────────────────────────────────────────────────────
function ScreenshotPlaceholder({ label }) {
  return (
    <View style={{
      width: '100%',
      aspectRatio: 16 / 10,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 14, color: colors.placeholder }}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mock Report (Trust Section 전용)
// ─────────────────────────────────────────────────────────────────
const SAMPLE_REPORT = {
  problem_verdict:    'confirmed',
  respondent_context: 'Product Manager · B2B SaaS · New York',
  top_pains: [
    { title: 'Communication clarity gap',           quote: 'I never know if they actually understood what I need', frequency: 'high'   },
    { title: 'Project delays from miscommunication', quote: 'Last quarter we delayed a launch by 3 weeks',          frequency: 'medium' },
  ],
  current_workarounds: ['Hiring local project managers', 'Over-documenting every requirement'],
  next_actions: ['Focus messaging on async clarity', 'Build status visibility as core feature'],
};

function RVerdictBadge({ status }) {
  const cfg = {
    confirmed: { bg: colors.primary,    color: colors.white,         label: 'Confirmed' },
    mixed:     { bg: colors.primaryMid, color: colors.white,         label: 'Mixed'     },
    rejected:  { bg: colors.border,     color: colors.textSecondary, label: 'Rejected'  },
  };
  const c = cfg[status] || cfg.mixed;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.color }}>✓ {c.label}</Text>
    </View>
  );
}

function RFreqBadge({ freq }) {
  const isHigh = freq === 'high';
  return (
    <View style={{ backgroundColor: isHigh ? colors.primary : colors.surface, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: isHigh ? colors.primary : colors.border, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: isHigh ? colors.white : colors.textSecondary }}>{freq}</Text>
    </View>
  );
}

function MockReport() {
  return (
    <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
      <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Interview Report</Text>
            <Text style={{ fontSize: 11, color: colors.textDisabled, marginTop: 2 }}>{SAMPLE_REPORT.respondent_context}</Text>
          </View>
          <RVerdictBadge status={SAMPLE_REPORT.problem_verdict} />
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.sm }} />

        <View style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.xs }}>Evidence Level</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3 }}>
              <View style={{ width: '88%', height: '100%', borderRadius: 3, backgroundColor: colors.primary }} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>High</Text>
          </View>
        </View>

        <View style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.xs }}>Top Pain Points</Text>
          {SAMPLE_REPORT.top_pains.map((pain, i) => (
            <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.primaryEnd, paddingLeft: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.xs, backgroundColor: colors.background, borderRadius: radius.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: spacing.xs }}>{pain.title}</Text>
                <RFreqBadge freq={pain.frequency} />
              </View>
              <Text style={{ fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 16 }}>"{pain.quote}"</Text>
            </View>
          ))}
        </View>

        <View style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.xs }}>Current Workarounds</Text>
          {SAMPLE_REPORT.current_workarounds.map((w, i) => (
            <View key={i} style={{ borderLeftWidth: 2, borderLeftColor: colors.primary, paddingLeft: spacing.sm, paddingVertical: 2, marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{w}</Text>
            </View>
          ))}
        </View>

        <View>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.xs }}>Next Actions</Text>
          {SAMPLE_REPORT.next_actions.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: colors.primaryEnd, fontWeight: '700' }}>→</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1, lineHeight: 16 }}>{a}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SurfaceCard>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function IntroScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop   = width >= MOBILE_BP;
  const setNavTitle = useStore(s => s.setNavTitle);

  const [showBetaModal, setShowBetaModal] = useState(false);
  const [stats, setStats]                 = useState({ questionLists: null, interviews: null, reports: null, betaUsers: null });
  const [activeTab, setActiveTab]         = useState('Question List');

  const scrollRef     = useRef(null);
  const howItWorksRef = useRef(null);
  const [howItWorksY, setHowItWorksY] = useState(0);

  // 내비게이션 헤더 숨김 (이중 NavBar 방지)
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

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

  useEffect(() => {
    async function loadStats() {
      try {
        const [ql, iv, rp, bu] = await Promise.all([
          fetch(`${API_BASE}/api/stats/question-lists-count`).then(r => r.json()).catch(() => ({ count: 0 })),
          fetch(`${API_BASE}/api/stats/interviews-count`).then(r => r.json()).catch(() => ({ count: 0 })),
          fetch(`${API_BASE}/api/stats/reports-count`).then(r => r.json()).catch(() => ({ count: 0 })),
          fetch(`${API_BASE}/api/stats/beta-users-count`).then(r => r.json()).catch(() => ({ count: 0 })),
        ]);
        setStats({
          questionLists: ql.count ?? 0,
          interviews:    iv.count ?? 0,
          reports:       rp.count ?? 0,
          betaUsers:     bu.count ?? 0,
        });
      } catch (_) {}
    }
    loadStats();
  }, []);

  function dismissBetaModal() {
    if (typeof localStorage !== 'undefined') localStorage.setItem('nitor8-beta-notice', 'true');
    setShowBetaModal(false);
  }

  function handleCTA() { navigation.navigate('Create'); }

  function scrollToHowItWorks() {
    if (Platform.OS === 'web' && howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    } else {
      scrollRef.current?.scrollTo({ y: howItWorksY, animated: true });
    }
  }

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
            <button
              onClick={dismissBetaModal}
              style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryMid}, ${colors.primaryEnd})`, color: colors.white, border: 'none', borderRadius: radius.md, padding: '12px 24px', fontSize: 19, fontWeight: 600, cursor: 'pointer', width: '40%' }}
            >
              Got it →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const PRODUCT_TABS = {
    'Question List': {
      desc: 'Describe your product and target customer. Get AI-generated Lean-style interview questions. Edit and regenerate until they feel right.',
      placeholder: '[ Question List Screenshot ]',
    },
    'Interview': {
      desc: "Share a unique link with your customer. Nitor runs the full English interview — questions, follow-ups, probing deeper — so you don't have to.",
      placeholder: '[ Interview Screenshot ]',
    },
    'Report': {
      desc: 'Every completed interview generates a structured report: problem verdict, evidence level, top pain points with quotes, and next actions.',
      placeholder: '[ Report Screenshot ]',
    },
  };

  const betaProgress = stats.betaUsers !== null
    ? Math.min(Math.round((stats.betaUsers / 100) * 100), 100)
    : 0;

  const trustCardBg = Platform.OS === 'web' ? `${colors.primary}1A` : colors.surface;

  return (
    <>
      {typeof document !== 'undefined' && <BetaModal />}

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >

          {/* ── 1. NAVBAR ─────────────────────────────────────── */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <LogoMark size={26} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 }}>
                Nitor8
              </Text>
            </View>
          </View>

          {/* ── 2. HERO ───────────────────────────────────────── */}
          <AnimatedSection style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingTop: isDesktop ? 96 : 64,
            paddingBottom: isDesktop ? 96 : 64,
            maxWidth: MAX_W + 200,
            alignSelf: 'center',
            width: '100%',
          }}>
            <View style={{
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'flex-start',
              gap: isDesktop ? spacing.xxl : spacing.xl,
            }}>
              {/* Copy */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 11, fontWeight: '600', letterSpacing: 1.5,
                  color: colors.primary, textTransform: 'uppercase',
                  marginBottom: spacing.md,
                }}>
                  GUIDED CUSTOMER DISCOVERY
                </Text>

                <GradientText style={{
                  fontSize: isDesktop ? 64 : 40,
                  lineHeight: isDesktop ? 76 : 50,
                  fontWeight: '800',
                  letterSpacing: -1.5,
                  marginBottom: spacing.xl,
                  color: colors.textPrimary,
                }}>
                  {"Go from 'I should\ntalk to customers'\nto a real interview link."}
                </GradientText>

                <Text style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 28,
                  marginBottom: spacing.xl,
                }}>
                  {'Describe your product. Get AI-generated interview questions. Share a link. Let Nitor run the English interview. Receive a report in your language.'}
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  flexWrap: 'wrap',
                  marginBottom: spacing.lg,
                }}>
                  <GradientButton label="Start for Free →" onPress={handleCTA} />
                  <TouchableOpacity
                    onPress={scrollToHowItWorks}
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      paddingVertical: 12,
                      paddingHorizontal: spacing.lg,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                      See how it works
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Free beta · No account needed · Text-based interviews
                </Text>
              </View>

              {/* Visual: 빈 박스 플레이스홀더 */}
              <View style={{
                flex: isDesktop ? 1 : undefined,
                width: isDesktop ? undefined : '100%',
              }}>
                <ScreenshotPlaceholder label="[ Interview Questions Preview ]" />
              </View>
            </View>
          </AnimatedSection>

          {/* ── 3. BETA TRUST STRIP ───────────────────────────── */}
          <AnimatedSection delay={0.1} style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingVertical: isDesktop ? 80 : 64,
          }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.xl,
              maxWidth: MAX_W,
              alignSelf: 'center',
              width: '100%',
              flexDirection: isDesktop ? 'row' : 'column',
              gap: isDesktop ? 0 : spacing.xl,
            }}>
              {[
                { value: stats.questionLists, label: 'Question lists generated' },
                { value: stats.interviews,    label: 'Interviews conducted'     },
                { value: stats.reports,       label: 'Reports delivered'        },
              ].map((item, i) => (
                <View key={i} style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingHorizontal: spacing.md,
                  borderRightWidth: isDesktop && i < 2 ? 1 : 0,
                  borderRightColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: isDesktop ? 48 : 36,
                    fontWeight: '800',
                    color: colors.textPrimary,
                    lineHeight: isDesktop ? 58 : 46,
                  }}>
                    {item.value !== null ? item.value : '—'}
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </AnimatedSection>

          {/* ── 4. HOW IT WORKS ───────────────────────────────── */}
          <View
            ref={howItWorksRef}
            onLayout={e => setHowItWorksY(e.nativeEvent.layout.y)}
          >
            <AnimatedSection delay={0.1} style={{
              paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
              paddingVertical: isDesktop ? 80 : 64,
            }}>
              <View style={{ maxWidth: MAX_W, alignSelf: 'center', width: '100%' }}>
                <Text style={{
                  fontSize: isDesktop ? 40 : 28,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  textAlign: 'center',
                  marginBottom: spacing.sm,
                }}>
                  How it works
                </Text>
                <Text style={{ fontSize: 18, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxl }}>
                  Three steps. No English required.
                </Text>

                <View style={{
                  flexDirection: isDesktop ? 'row' : 'column',
                  gap: isDesktop ? 0 : spacing.xl,
                  alignItems: 'flex-start',
                }}>
                  {[
                    {
                      accent: colors.primary,
                      title: 'Describe your product',
                      body:  'Enter your product and target customer in your own language.',
                    },
                    {
                      accent: colors.primaryMid,
                      title: 'Generate & share',
                      body:  'Get AI interview questions and share your link with potential customers.',
                    },
                    {
                      accent: colors.primaryEnd,
                      title: 'Get your report',
                      body:  'Nitor conducts the English interview. You receive a structured report.',
                    },
                  ].map((step, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', paddingHorizontal: isDesktop ? spacing.xl : 0 }}>
                      {isDesktop && i < 2 && (
                        <View style={{ position: 'absolute', top: 22, right: -spacing.sm, left: '50%', height: 1, backgroundColor: colors.border }} />
                      )}
                      <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: step.accent, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                        <Text style={{ fontSize: 18, color: colors.white, fontWeight: '700' }}>✦</Text>
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs }}>
                        {step.title}
                      </Text>
                      <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 }}>
                        {step.body}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </AnimatedSection>
          </View>

          {/* ── 5. PRODUCT PREVIEW ────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingVertical: isDesktop ? 80 : 64,
            backgroundColor: colors.surface,
          }}>
            <View style={{ maxWidth: MAX_W, alignSelf: 'center', width: '100%' }}>
              <Text style={{
                fontSize: isDesktop ? 40 : 28,
                fontWeight: '700',
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: spacing.sm,
              }}>
                See it in action
              </Text>
              <Text style={{ fontSize: 18, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }}>
                From questions to report — in minutes.
              </Text>

              {/* Tab bar */}
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.xl }}>
                {['Question List', 'Interview', 'Report'].map(tab => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: spacing.sm,
                      paddingHorizontal: isDesktop ? spacing.lg : spacing.md,
                      borderBottomWidth: 2,
                      borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
                      marginBottom: -1,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: activeTab === tab ? '600' : '400',
                      color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                    }}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab content */}
              <View style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: isDesktop ? spacing.xxl : spacing.xl,
                alignItems: isDesktop ? 'center' : 'stretch',
              }}>
                {/* Left: description */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm }}>
                    {activeTab}
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 28, marginBottom: spacing.lg }}>
                    {PRODUCT_TABS[activeTab]?.desc}
                  </Text>
                  <TouchableOpacity onPress={handleCTA} activeOpacity={0.8} style={{ alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                      Try it yourself →
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Right: 빈 박스 플레이스홀더 */}
                <View style={{ flex: isDesktop ? 1.4 : 1 }}>
                  <ScreenshotPlaceholder label={PRODUCT_TABS[activeTab]?.placeholder} />
                </View>
              </View>
            </View>
          </AnimatedSection>

          {/* ── 6. TRUST SECTION ──────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingVertical: isDesktop ? 80 : 64,
          }}>
            <View style={{ maxWidth: 720, alignSelf: 'center', width: '100%' }}>
              <SurfaceCard style={{ backgroundColor: trustCardBg, borderColor: colors.primary }}>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                  REPORT PREVIEW
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg }}>
                  What a real report looks like
                </Text>

                <MockReport />

                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.lg }} />

                <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26, marginBottom: spacing.md }}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Lean-style interview questions </Text>
                  built on Cindy Alvarez's customer development principles. Every question is designed to reveal real problems, not validate assumptions.
                </Text>

                <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 26, marginBottom: spacing.lg }}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Built by a non-native founder, </Text>
                  for non-native founders. The language barrier is real. Nitor8 removes it entirely.
                </Text>

                <View style={Platform.OS === 'web' ? {
                  backgroundColor: `${colors.primary}33`,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                } : {
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                    Free beta · No account needed · Text-based interviews
                  </Text>
                </View>

              </SurfaceCard>
            </View>
          </AnimatedSection>

          {/* ── 7. PRICING ────────────────────────────────────── */}
          <AnimatedSection delay={0.1} style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingVertical: isDesktop ? 80 : 64,
            backgroundColor: colors.surface,
          }}>
            <View style={{ maxWidth: MAX_W, alignSelf: 'center', width: '100%', alignItems: 'center' }}>
              <Text style={{
                fontSize: isDesktop ? 80 : 48,
                fontWeight: '900',
                color: colors.textPrimary,
                textAlign: 'center',
                letterSpacing: -2,
                lineHeight: isDesktop ? 88 : 56,
                marginBottom: spacing.sm,
              }}>
                FREE during beta
              </Text>
              <Text style={{ fontSize: 18, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxl }}>
                Join the first 100 founders.
              </Text>

              <SurfaceCard style={{ width: '100%', maxWidth: 560 }}>

                {/* Feature grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
                  {[
                    'AI interview questions in English',
                    'Interview link sharing',
                    'AI conducts the interview',
                    'Report in your language',
                    'No account needed',
                    'Text-based (async)',
                  ].map((feat, i) => (
                    <View key={i} style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryEnd }}>✓</Text>
                      <Text style={{ fontSize: 16, color: colors.textSecondary, flex: 1, lineHeight: 24 }}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.lg }} />

                {/* Beta counter */}
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm }}>
                  {stats.betaUsers !== null
                    ? `${stats.betaUsers} / 100 beta spots taken`
                    : '... / 100 beta spots'}
                </Text>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: radius.full, marginBottom: spacing.xl }}>
                  <View style={{ width: `${betaProgress}%`, height: '100%', backgroundColor: colors.primary, borderRadius: radius.full }} />
                </View>

                <GradientButton
                  label="Start for Free →"
                  onPress={handleCTA}
                  style={{ alignSelf: 'center', minWidth: 240 }}
                />
              </SurfaceCard>
            </View>
          </AnimatedSection>

          {/* ── 8. FINAL CTA ──────────────────────────────────── */}
          <AnimatedSection delay={0.1}>
            <View style={{
              backgroundColor: colors.textPrimary,
              paddingVertical: 80,
              paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: isDesktop ? 36 : 26,
                fontWeight: '700',
                color: colors.white,
                textAlign: 'center',
                marginBottom: spacing.sm,
              }}>
                Ready to talk to your customers?
              </Text>
              <View style={{ opacity: 0.6 }}>
                <Text style={{ fontSize: 16, color: colors.white, textAlign: 'center', marginBottom: spacing.xl }}>
                  No account needed. Free during beta.
                </Text>
              </View>
              <GradientButton label="Start for Free →" onPress={handleCTA} />
            </View>
          </AnimatedSection>

          {/* ── 9. FOOTER ─────────────────────────────────────── */}
          <View style={{
            paddingHorizontal: isDesktop ? spacing.xxl : spacing.md,
            paddingVertical: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isDesktop ? 'center' : 'flex-start',
            gap: spacing.md,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <LogoMark size={20} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Nitor8 © 2026</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>@nitor8_hq on X</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

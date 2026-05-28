// frontend/src/screens/IntroScreen.js

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated, Platform, PanResponder, View, Text, ScrollView, TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import GradientButton from '../components/GradientButton';
import LegalModal from '../components/LegalModal';
import LogoMark from '../components/LogoMark';
import useStore from '../store/useStore';
import { colors, spacing, radius } from '../theme';

const MOBILE_BP = 700;
const MAX_W     = 1100;
const API_BASE  = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// Scroll-in animation (web only)
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
// Screenshot placeholder
// ─────────────────────────────────────────────────────────────────
function ScreenshotPlaceholder({ label, aspectRatio = 16 / 10 }) {
  return (
    <View style={{
      width: '100%',
      aspectRatio,
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
// How It Works 카드
// ─────────────────────────────────────────────────────────────────
function StepCard({ step, color, isDesktop }) {
  return (
    <View style={{
      width: isDesktop ? 280 : '100%',
      height: isDesktop ? 380 : 300,
      backgroundColor: color,
      borderRadius: radius.xl,
      position: 'relative',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    }}>
      {/* 숫자 배지 — 좌측 상단 */}
      <View style={{
        position: 'absolute',
        top: 12,
        left: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{step.num}</Text>
      </View>

      {/* 텍스트 — 하단 중앙 */}
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.white,
          textAlign: 'center',
          marginBottom: spacing.xs,
        }}>
          {step.title}
        </Text>
        <Text style={{
          fontSize: 13,
          color: colors.white,
          lineHeight: 20,
          textAlign: 'center',
          opacity: 0.9,
        }}>
          {step.body}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────
const STEP_COLORS = [colors.primary, colors.primaryMid, colors.primaryEnd];

const HOW_IT_WORKS = [
  {
    num: '1',
    title: 'Describe your product',
    body: 'Enter your product and target customer in your own language.',
  },
  {
    num: '2',
    title: 'Generate & share',
    body: 'Get AI questions and share your link with potential customers.',
  },
  {
    num: '3',
    title: 'Get your report',
    body: 'Nitor runs the English interview. You get a structured report.',
  },
];

const PRODUCT_TABS = [
  {
    title: 'Question List',
    desc: 'Describe your product and target customer. Get AI-generated Lean-style interview questions.',
    link: 'Try it yourself →',
    placeholder: '[ Question List Screenshot ]',
  },
  {
    title: 'AI Interview',
    desc: 'Share the link. Nitor conducts the English interview automatically. No live call needed.',
    link: 'See how it works →',
    placeholder: '[ Interview Screenshot ]',
  },
  {
    title: 'Your Report',
    desc: 'Receive a structured Lean-style report in your language. Problem verdict, pain points, evidence quotes.',
    link: 'View sample report →',
    placeholder: '[ Report Screenshot ]',
  },
];

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function IntroScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop   = width >= MOBILE_BP;
  const setNavTitle = useStore(s => s.setNavTitle);

  const [showBetaModal, setShowBetaModal] = useState(false);
  const [stats, setStats]                 = useState({ questionLists: null, interviews: null, reports: null, betaUsers: null });
  const [activeTab, setActiveTab]         = useState(0);
  const [legalModal, setLegalModal]       = useState(null); // null | 'privacy' | 'terms'

  const scrollRef      = useRef(null);
  const howItWorksRef  = useRef(null);
  const productRef     = useRef(null);
  const trustRef       = useRef(null);
  const pricingRef     = useRef(null);

  const [howItWorksY, setHowItWorksY] = useState(0);
  const [productY,    setProductY]    = useState(0);
  const [trustY,      setTrustY]      = useState(0);
  const [pricingY,    setPricingY]    = useState(0);

  // 섹션3 슬라이드 애니메이션
  const tabOpacity = useRef(new Animated.Value(1)).current;

  // PanResponder — 드래그 50px 이상이면 탭 전환
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) <= 50) return;
        const dir = g.dx < 0 ? 1 : 2;
        Animated.timing(tabOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setActiveTab(prev => (prev + dir) % 3);
          Animated.timing(tabOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
      },
    })
  ).current;

  // 3초 자동 슬라이드
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(tabOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setActiveTab(prev => (prev + 1) % 3);
        Animated.timing(tabOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 3000);
    return () => clearInterval(id);
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

  function scrollToSection(ref, y) {
    if (Platform.OS === 'web' && ref.current) {
      ref.current.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    } else {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }

  function scrollToHowItWorks() { scrollToSection(howItWorksRef, howItWorksY); }
  function scrollToProduct()    { scrollToSection(productRef, productY); }
  function scrollToTrust()      { scrollToSection(trustRef, trustY); }
  function scrollToPricing()    { scrollToSection(pricingRef, pricingY); }

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

  const betaProgress = stats.betaUsers !== null
    ? Math.min(Math.round((stats.betaUsers / 100) * 100), 100)
    : 0;

  return (
    <>
      {typeof document !== 'undefined' && <BetaModal />}

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >

          {/* ── NAVBAR ─────────────────────────────────────────── */}
          <View style={[{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            zIndex: 100,
          }, Platform.OS === 'web' && { position: 'sticky', top: 0 }]}>
            <TouchableOpacity
              onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <LogoMark size={26} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 }}>
                Nitor8
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {isDesktop && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[
                  { label: 'How it works', onPress: scrollToHowItWorks },
                  { label: 'Product',      onPress: scrollToProduct },
                  { label: 'Trust',        onPress: scrollToTrust },
                  { label: 'Pricing',      onPress: scrollToPricing },
                ].map((link, i) => (
                  <TouchableOpacity key={i} onPress={link.onPress} activeOpacity={0.7} style={{ marginLeft: spacing.lg }}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── 1. HERO ───────────────────────────────────────── */}
          <AnimatedSection style={{
            paddingHorizontal: 0,
            maxWidth: 1600,
            alignSelf: 'center',
            width: '100%',
            marginTop: 48,
          }}>
            <View style={{
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'flex-start',
              gap: isDesktop ? 8 : spacing.xl,
            }}>
              {/* Copy */}
              <View style={{
                flex: isDesktop ? 1.2 : 1,
                paddingVertical: isDesktop ? 80 : 48,
                paddingLeft: spacing.md,
                paddingRight: 0,
              }}>
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
                  {"Real customer interviews.\nNo English required."}
                </GradientText>

                <View style={{ paddingLeft: spacing.xl }}>
                  <Text style={{
                    fontSize: 16,
                    color: colors.textSecondary,
                    lineHeight: 28,
                    marginBottom: spacing.xl,
                  }}>
                    {'Describe your product. Get AI-generated interview questions. Share a link.\nLet Nitor run the English interview. Receive a report in your language.'}
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
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                      }}
                    >
                      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.textSecondary }}>
                        See how it works
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Free beta · No account needed · Text-based interviews
                  </Text>
                </View>
              </View>

              {/* Visual */}
              <View style={{
                flex: isDesktop ? 0.8 : undefined,
                width: isDesktop ? undefined : '100%',
                alignSelf: 'stretch',
                paddingRight: spacing.xl,
              }}>
                <View style={{
                  flex: 1,
                  minHeight: 520,
                  backgroundColor: colors.surface,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, color: colors.placeholder }}>[ Interview Questions Preview ]</Text>
                </View>
              </View>
            </View>
          </AnimatedSection>

          {/* ── 2. BETA TRUST STRIP ───────────────────────────── */}
          <AnimatedSection delay={0.1} style={{
            paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
            paddingVertical: isDesktop ? 80 : 64,
            marginTop: spacing.md,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing.xxl,
              flexWrap: 'wrap',
            }}>
              {[
                { value: stats.questionLists, label: 'Question lists generated' },
                { value: stats.interviews,    label: 'Interviews conducted'     },
                { value: stats.reports,       label: 'Reports delivered'        },
              ].map((item, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
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

          {/* ── 3. HOW IT WORKS ───────────────────────────────── */}
          <View
            ref={howItWorksRef}
            onLayout={e => setHowItWorksY(e.nativeEvent.layout.y)}
          >
            <AnimatedSection delay={0.1} style={{
              paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
              paddingVertical: isDesktop ? 80 : 64,
            }}>
              <View style={{ maxWidth: MAX_W, alignSelf: 'center', width: '100%' }}>
                <Text style={{
                  fontSize: isDesktop ? 48 : 32,
                  fontWeight: '800',
                  color: colors.textPrimary,
                  marginBottom: Math.round(spacing.xxl * 2.5),
                }}>
                  Just Three Steps. No English Required.
                </Text>

                {isDesktop ? (
                  <View style={{
                    flexDirection: 'row',
                    gap: spacing.xl,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {HOW_IT_WORKS.map((step, i) => (
                      <StepCard key={i} step={step} color={STEP_COLORS[i]} isDesktop={isDesktop} />
                    ))}
                  </View>
                ) : (
                  <View style={{ gap: spacing.xl }}>
                    {HOW_IT_WORKS.map((step, i) => (
                      <StepCard key={i} step={step} color={STEP_COLORS[i]} isDesktop={isDesktop} />
                    ))}
                  </View>
                )}
              </View>
            </AnimatedSection>
          </View>

          {/* ── 4. PRODUCT PREVIEW ────────────────────────────── */}
          <View
            ref={productRef}
            onLayout={e => setProductY(e.nativeEvent.layout.y)}
          >
            <AnimatedSection delay={0.1} style={{
              paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
              paddingVertical: isDesktop ? 80 : 64,
              backgroundColor: colors.background,
            }}>
              <View style={{ maxWidth: MAX_W, alignSelf: 'center', width: '100%' }}>
                <Text style={{
                  fontSize: isDesktop ? 48 : 32,
                  fontWeight: '800',
                  color: colors.textPrimary,
                  marginBottom: 64,
                }}>
                  From questions to report — in minutes.
                </Text>

                <View style={{
                  flexDirection: isDesktop ? 'row' : 'column',
                  gap: isDesktop ? spacing.xxl : spacing.xl,
                  alignItems: isDesktop ? 'center' : 'stretch',
                }}>
                  {/* 좌측: 설명 텍스트 */}
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Animated.View style={{ opacity: tabOpacity }}>
                      <Text style={{
                        fontSize: isDesktop ? 36 : 24,
                        fontWeight: '800',
                        color: colors.textPrimary,
                        marginBottom: spacing.xl,
                      }}>
                        {PRODUCT_TABS[activeTab].title}
                      </Text>
                      <Text style={{
                        fontSize: 16,
                        color: colors.textSecondary,
                        lineHeight: 28,
                        marginTop: spacing.lg,
                        marginBottom: spacing.lg,
                      }}>
                        {PRODUCT_TABS[activeTab].desc}
                      </Text>
                      <TouchableOpacity onPress={handleCTA} activeOpacity={0.8} style={{ alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                          {PRODUCT_TABS[activeTab].link}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {/* 우측: 카드 스택 */}
                  <View style={{ flex: isDesktop ? 1.4 : 1, paddingRight: 28, paddingBottom: 20 }}>
                    <View style={{ position: 'relative' }} {...panResponder.panHandlers}>
                      {/* 뒤 카드 */}
                      <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        zIndex: 1,
                        transform: [{ translateX: 24 }, { translateY: 16 }],
                        opacity: 0.35,
                      }}>
                        <ScreenshotPlaceholder label="" aspectRatio={1} />
                      </View>
                      {/* 가운데 카드 */}
                      <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        zIndex: 2,
                        transform: [{ translateX: 12 }, { translateY: 8 }],
                        opacity: 0.6,
                      }}>
                        <ScreenshotPlaceholder label="" aspectRatio={1} />
                      </View>
                      {/* 앞 카드 (활성) */}
                      <Animated.View style={{ zIndex: 3, opacity: tabOpacity }}>
                        <ScreenshotPlaceholder
                          label={PRODUCT_TABS[activeTab].placeholder}
                          aspectRatio={1}
                        />
                      </Animated.View>
                    </View>
                  </View>
                </View>
              </View>
            </AnimatedSection>
          </View>

          {/* ── 5. TRUST SECTION ──────────────────────────────── */}
          <View
            ref={trustRef}
            onLayout={e => setTrustY(e.nativeEvent.layout.y)}
          >
            <AnimatedSection delay={0.1} style={{
              paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
              paddingVertical: isDesktop ? 80 : 64,
            }}>
              <View style={{ maxWidth: 720, alignSelf: 'center', width: '100%' }}>
                <View style={{
                  width: '100%',
                  minHeight: 700,
                  backgroundColor: colors.surface,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, color: colors.placeholder }}>[ Report Screenshot ]</Text>
                </View>
              </View>
            </AnimatedSection>
          </View>

          {/* ── 6. PRICING ────────────────────────────────────── */}
          <View
            ref={pricingRef}
            onLayout={e => setPricingY(e.nativeEvent.layout.y)}
          >
            <AnimatedSection delay={0.1} style={{
              paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
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
                }}>
                  FREE during beta
                </Text>
                <Text style={{
                  fontSize: 18,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: Math.round(spacing.xxl * 1.5),
                  marginBottom: spacing.xxl,
                }}>
                  Join the first 100 founders.
                </Text>

                <SurfaceCard style={{ width: '100%', maxWidth: 560 }}>

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
          </View>

          {/* ── 7. FINAL CTA ──────────────────────────────────── */}
          <AnimatedSection delay={0.1}>
            <View style={{
              backgroundColor: colors.textPrimary,
              paddingVertical: isDesktop ? 252 : 250,
              paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: isDesktop ? 64 : 40,
                fontWeight: '900',
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

          {/* ── 8. FOOTER ─────────────────────────────────────── */}
          <View style={{
            paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
              <TouchableOpacity onPress={() => setLegalModal('privacy')} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLegalModal('terms')} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>@nitor8_hq on X</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      <LegalModal
        visible={!!legalModal}
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />
    </>
  );
}

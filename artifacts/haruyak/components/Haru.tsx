import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export const pillImage = require('@/assets/images/pill.png');
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function parseDate(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}
export function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function koDate(d: string, withYear = false): string {
  const x = parseDate(d);
  return `${withYear ? `${x.getFullYear()}년 ` : ''}${x.getMonth() + 1}월 ${x.getDate()}일 (${WEEKDAYS[x.getDay()]})`;
}

export function useTopPad() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'web' ? 67 : insets.top + 12;
}
export const BOTTOM_PAD = Platform.OS === 'web' ? 120 : 110;

export function PillIcon({ size = 28 }: { size?: number }) {
  return <Image source={pillImage} style={{ width: size, height: size }} resizeMode="contain" />;
}

export function Background() {
  const c = useColors();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} />
      <View style={[styles.blob, { backgroundColor: c.backgroundPeach, top: -140, left: -120 }]} />
      <View style={[styles.blob, { backgroundColor: c.backgroundLilac, top: 120, right: -160, opacity: 0.8 }]} />
    </View>
  );
}

export function ScreenHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: c.brand }]}>{eyebrow}</Text>
        <Text style={[styles.h1, { color: c.foreground }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

type BtnKind = 'primary' | 'soft' | 'danger' | 'ghost';
export function Btn({
  label,
  icon,
  onPress,
  kind = 'soft',
  disabled,
  small,
  testID,
  style,
}: {
  label?: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  kind?: BtnKind;
  disabled?: boolean;
  small?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = disabled
    ? c.muted
    : kind === 'primary'
      ? c.primary
      : kind === 'danger'
        ? c.destructiveSoft
        : kind === 'ghost'
          ? 'transparent'
          : c.secondary;
  const fg = disabled ? c.mutedForeground : kind === 'primary' ? c.primaryForeground : kind === 'danger' ? c.destructive : c.secondaryForeground;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, transform: [{ scale: pressed ? 0.96 : 1 }] },
        kind === 'ghost' && { borderWidth: 1, borderColor: c.border },
        style,
      ]}
    >
      {icon && <Feather name={icon} size={small ? 14 : 16} color={fg} />}
      {label ? <Text style={[styles.btnText, small && { fontSize: 12 }, { color: fg }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Progress({ value, height = 8 }: { value: number; height?: number }) {
  const c = useColors();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: c.progressTrack, overflow: 'hidden' }}>
      <LinearGradient
        colors={[c.progressFrom, c.progressTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height }}
      />
    </View>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  const c = useColors();
  return (
    <LinearGradient colors={[c.card, c.muted]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.empty, { borderColor: c.input }]}>
      <View style={[styles.emptyIcon, { backgroundColor: c.white }]}>
        <PillIcon size={40} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: c.mutedForeground }]}>{body}</Text>
      {action}
    </LinearGradient>
  );
}

export function Skeleton({ h = 52 }: { h?: number }) {
  const c = useColors();
  return <View style={{ height: h, borderRadius: 14, backgroundColor: c.muted, marginVertical: 4, opacity: 0.7 }} />;
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.h2, { color: c.foreground }]}>{children}</Text>
      {right}
    </View>
  );
}

export function rowTint(i: number, c: ReturnType<typeof useColors>) {
  const k = i % 3;
  return k === 0 ? { bg: c.rowPeach, edge: c.rowPeachEdge } : k === 1 ? { bg: c.rowLilac, edge: c.rowLilacEdge } : { bg: c.rowSky, edge: c.rowSkyEdge };
}

export const styles = StyleSheet.create({
  blob: { position: 'absolute', width: 380, height: 380, borderRadius: 190, opacity: 0.9 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 2.2, marginBottom: 3 },
  h1: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -1 },
  h2: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.4 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, marginVertical: 6 },
  btn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnSmall: { minHeight: 34, paddingHorizontal: 10, borderRadius: 11 },
  btnText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 22, padding: 24, alignItems: 'center', gap: 6, marginVertical: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.3 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10, marginBottom: 4 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  bold: { fontFamily: 'Inter_700Bold' },
  semi: { fontFamily: 'Inter_600SemiBold' },
});

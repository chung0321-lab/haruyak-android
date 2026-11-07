import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { readDatabase, today, type Database } from '@/lib/store';
import { refreshWidgets } from '@/lib/widget-refresh';
import { useColors } from '@/hooks/useColors';

type Toast = { id: number; text: string; tone: 'ok' | 'error' };
type ConfirmOpts = { title: string; message: string; confirmLabel?: string; destructive?: boolean };

type Ctx = {
  db: Database | null;
  todayStr: string;
  loadError: string | null;
  reload: () => Promise<void>;
  run: (fn: () => Promise<Database>, success?: string) => Promise<boolean>;
  toast: (text: string, tone?: 'ok' | 'error') => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
};

const HaruContext = createContext<Ctx | null>(null);

export function errorText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string') return e;
  return '알 수 없는 오류가 발생했어요.';
}

export function HaruProvider({ children }: { children: React.ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [db, setDb] = useState<Database | null>(null);
  const [todayStr, setTodayStr] = useState<string>(today());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastState, setToastState] = useState<Toast | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const lastJson = useRef<string>('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((next: Database) => {
    const json = JSON.stringify(next);
    if (json !== lastJson.current) {
      lastJson.current = json;
      setDb(next);
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      apply(await readDatabase());
      setLoadError(null);
    } catch (e) {
      setLoadError(errorText(e));
    }
    const t = today();
    setTodayStr((p) => (p === t ? p : t));
  }, [apply]);

  useEffect(() => {
    reload();
    const poll = setInterval(reload, 2000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') reload();
    });
    return () => {
      clearInterval(poll);
      sub.remove();
    };
  }, [reload]);

  // local midnight tick
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const id = setTimeout(() => setTodayStr(today()), next.getTime() - now.getTime());
    return () => clearTimeout(id);
  }, [todayStr]);

  const toast = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastState({ id: Date.now(), text, tone });
    toastTimer.current = setTimeout(() => setToastState(null), tone === 'error' ? 4200 : 2200);
  }, []);

  const run = useCallback(
    async (fn: () => Promise<Database>, success?: string) => {
      try {
        const next = await fn();
        apply(next);
        try {
          await refreshWidgets();
          if (success) toast(success);
        } catch {
          toast('기록은 저장했지만 위젯 갱신에 실패했어요. 위젯 새로고침을 눌러 주세요.', 'error');
        }
        return true;
      } catch (e) {
        toast(errorText(e), 'error');
        return false;
      }
    },
    [apply, toast],
  );

  const confirm = useCallback((o: ConfirmOpts) => {
    return new Promise<boolean>((res) => {
      resolver.current = res;
      setConfirmState(o);
    });
  }, []);

  const close = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setConfirmState(null);
  };

  const value = useMemo(
    () => ({ db, todayStr, loadError, reload, run, toast, confirm }),
    [db, todayStr, loadError, reload, run, toast, confirm],
  );

  return (
    <HaruContext.Provider value={value}>
      {children}
      {toastState && (
        <Animated.View
          key={toastState.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="none"
          style={[
            styles.toast,
            { top: insets.top + 10, backgroundColor: toastState.tone === 'error' ? c.toastError : c.toast },
          ]}
        >
          <Feather name={toastState.tone === 'error' ? 'alert-circle' : 'check-circle'} size={16} color={c.primaryForeground} />
          <Text style={[styles.toastText, { color: c.primaryForeground }]}>{toastState.text}</Text>
        </Animated.View>
      )}
      <Modal transparent visible={!!confirmState} animationType="fade" onRequestClose={() => close(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={() => close(false)}>
          <Pressable style={[styles.dialog, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => undefined}>
            <View style={[styles.dialogIcon, { backgroundColor: confirmState?.destructive ? c.destructiveSoft : c.secondary }]}>
              <Feather name={confirmState?.destructive ? 'alert-triangle' : 'help-circle'} size={20} color={confirmState?.destructive ? c.destructive : c.primary} />
            </View>
            <Text style={[styles.dialogTitle, { color: c.foreground }]}>{confirmState?.title}</Text>
            <Text style={[styles.dialogMsg, { color: c.mutedForeground }]}>{confirmState?.message}</Text>
            <View style={styles.dialogRow}>
              <Pressable testID="confirm-cancel" onPress={() => close(false)} style={[styles.dBtn, { backgroundColor: c.secondary }]}>
                <Text style={[styles.dBtnText, { color: c.secondaryForeground }]}>취소</Text>
              </Pressable>
              <Pressable
                testID="confirm-ok"
                onPress={() => close(true)}
                style={[styles.dBtn, { backgroundColor: confirmState?.destructive ? c.destructive : c.primary }]}
              >
                <Text style={[styles.dBtnText, { color: c.primaryForeground }]}>{confirmState?.confirmLabel ?? '확인'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </HaruContext.Provider>
  );
}

export function useHaru() {
  const ctx = useContext(HaruContext);
  if (!ctx) throw new Error('useHaru must be used within HaruProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 100,
  },
  toastText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flexShrink: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 26, padding: 22, borderWidth: 1 },
  dialogIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 8, letterSpacing: -0.4 },
  dialogMsg: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  dialogRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  dBtn: { flex: 1, minHeight: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});

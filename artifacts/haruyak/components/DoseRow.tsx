import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { Slot } from '@/lib/store';
import { useColors } from '@/hooks/useColors';
import { rowTint } from '@/components/Haru';

export function DoseRow({
  slot,
  index,
  done,
  future,
  editing,
  isFirst,
  isLast,
  onToggle,
  onOpen,
  onMove,
}: {
  slot: Slot;
  index: number;
  done: boolean;
  future: boolean;
  editing?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  onMove?: (dir: -1 | 1) => void;
}) {
  const c = useColors();
  const tint = rowTint(index, c);
  const bg = done ? c.doneBg : tint.bg;
  const edge = done ? c.doneEdge : tint.edge;
  const sub = [slot.t, slot.m.dose].filter(Boolean).join(' · ');
  return (
    <View style={[s.row, { backgroundColor: bg, borderLeftColor: edge, borderColor: c.border }]}>
      <Pressable testID={`dose-open-${slot.key}`} onPress={onOpen} style={s.info} accessibilityLabel={`${slot.m.name} 상세`}>
        <Text numberOfLines={1} style={[s.name, { color: c.cardForeground }, done && { textDecorationLine: 'line-through', color: c.mutedForeground }]}>
          {slot.m.name}
        </Text>
        <Text numberOfLines={1} style={[s.sub, { color: c.mutedForeground }]}>
          {sub}
        </Text>
      </Pressable>
      {editing ? (
        <View style={s.moves}>
          {([-1, 1] as const).map((d) => {
            const dis = d === -1 ? isFirst : isLast;
            return (
              <Pressable
                key={d}
                testID={`dose-move-${d}-${slot.key}`}
                disabled={dis}
                onPress={() => onMove?.(d)}
                accessibilityLabel={d === -1 ? '위로' : '아래로'}
                style={[s.move, { backgroundColor: c.secondary, opacity: dis ? 0.3 : 1 }]}
              >
                <Feather name={d === -1 ? 'chevron-up' : 'chevron-down'} size={18} color={c.primary} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Pressable
          testID={`dose-toggle-${slot.key}`}
          disabled={future}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            onToggle();
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done, disabled: future }}
          style={({ pressed }) => [
            s.check,
            {
              backgroundColor: future ? c.muted : done ? c.doneButton : c.primary,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <Feather name={future ? 'clock' : done ? 'rotate-ccw' : 'check'} size={14} color={future ? c.mutedForeground : done ? c.doneButtonText : c.primaryForeground} />
          <Text style={[s.checkText, { color: future ? c.mutedForeground : done ? c.doneButtonText : c.primaryForeground }]}>
            {future ? '예정' : done ? '취소' : '먹음'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginVertical: 3,
    paddingRight: 4,
    gap: 4,
  },
  info: { flex: 1, minWidth: 0, paddingHorizontal: 10, paddingVertical: 5, justifyContent: 'center', minHeight: 46 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 18 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15 },
  check: { minWidth: 64, minHeight: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  checkText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  moves: { flexDirection: 'row', gap: 3 },
  move: { width: 38, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

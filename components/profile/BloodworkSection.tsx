import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { BloodworkMarkerRow } from './BloodworkMarkerRow';
import { AddBloodworkSheet } from './AddBloodworkSheet';
import {
  interpretBloodwork,
  type BloodworkEntry,
  type InterpretResponse,
} from '../../services/bloodwork';

interface Props {
  token: string;
  entries: BloodworkEntry[];
  onEntryAdded: (entry: BloodworkEntry) => void;
}

export function BloodworkSection({ token, entries, onEntryAdded }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [interpret, setInterpret] = useState<InterpretResponse | null>(null);
  const [loadingInterpret, setLoadingInterpret] = useState(false);
  const [interpretLoaded, setInterpretLoaded] = useState(false);

  const loadInterpretation = useCallback(async () => {
    if (interpretLoaded || entries.length === 0) return;
    setLoadingInterpret(true);
    try {
      const res = await interpretBloodwork(token);
      setInterpret(res);
    } catch {
      /* non-critical */
    } finally {
      setLoadingInterpret(false);
      setInterpretLoaded(true);
    }
  }, [token, interpretLoaded, entries.length]);

  // Trigger on first render of this section (called when accordion opens)
  useState(() => {
    void loadInterpretation();
  });

  const topInterpretations = interpret?.interpretations
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 3) ?? [];

  return (
    <View style={styles.container}>
      {/* Marker list */}
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No blood test results logged yet.</Text>
        </View>
      ) : (
        <View style={styles.markerList}>
          {entries.map((e) => (
            <BloodworkMarkerRow key={e._id} entry={e} />
          ))}
        </View>
      )}

      {/* Add button */}
      <Pressable
        onPress={() => setAddSheetOpen(true)}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel="Add blood marker"
      >
        <Text style={styles.addBtnText}>+ Add Marker</Text>
      </Pressable>

      {/* AI Interpretation */}
      {entries.length > 0 && (
        <View style={styles.interpretCard}>
          <Text style={styles.interpretTitle}>AI Interpretation</Text>
          {loadingInterpret ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: spacing.md }} />
          ) : interpret === null ? (
            <Text style={styles.interpretEmpty}>Could not load interpretation.</Text>
          ) : interpret.interpretations.length === 0 ? (
            <Text style={styles.interpretEmpty}>No interpretation available yet.</Text>
          ) : (
            <>
              {interpret.overall_summary.length > 0 && (
                <Text style={styles.overallSummary}>{interpret.overall_summary}</Text>
              )}
              {topInterpretations.map((item) => (
                <View key={item.marker} style={styles.interpretRow}>
                  <View style={[styles.priorityDot, { backgroundColor: item.priority === 'high' ? c.danger : item.priority === 'medium' ? c.warning : c.ok }]} />
                  <View style={styles.interpretRowRight}>
                    <Text style={styles.interpretMarker}>{item.marker} — <Text style={styles.interpretStatus}>{item.status.replace(/_/g, ' ')}</Text></Text>
                    <Text style={styles.interpretInsight}>{item.personalised_insight}</Text>
                    {item.recommendation.length > 0 && (
                      <Text style={styles.interpretRec}>→ {item.recommendation}</Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      <AddBloodworkSheet
        visible={addSheetOpen}
        token={token}
        onClose={() => setAddSheetOpen(false)}
        onSaved={(entry) => {
          setAddSheetOpen(false);
          onEntryAdded(entry);
          setInterpretLoaded(false);
          setInterpret(null);
        }}
      />
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { paddingTop: spacing.sm },
    emptyState: { paddingVertical: spacing.md },
    emptyText: { fontSize: 13, color: c.text3, fontStyle: 'italic' },
    markerList: { marginBottom: spacing.sm },
    addBtn: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: c.primaryLight,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.primary + '40',
      marginBottom: spacing.lg,
    },
    addBtnText: { fontSize: 13, fontWeight: '700', color: c.primary },
    interpretCard: {
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
    },
    interpretTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.text2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    interpretEmpty: { fontSize: 12, color: c.text3, fontStyle: 'italic' },
    overallSummary: {
      fontSize: 13,
      color: c.text,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    interpretRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 5,
      flexShrink: 0,
    },
    interpretRowRight: { flex: 1 },
    interpretMarker: { fontSize: 13, fontWeight: '600', color: c.text },
    interpretStatus: { fontWeight: '400', color: c.text2 },
    interpretInsight: { fontSize: 12, color: c.text2, lineHeight: 17, marginTop: 2 },
    interpretRec: { fontSize: 12, color: c.primary, marginTop: 2, fontWeight: '500' },
  });
}

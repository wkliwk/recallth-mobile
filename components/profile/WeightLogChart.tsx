/**
 * WeightLogChart — inline spark-line trend for the last N weight entries.
 *
 * No external chart library required — draws a polyline using absolute-
 * positioned View elements (thin line segments) to keep bundle size small
 * and avoid native module setup.
 *
 * Shows: min/max labels on y-axis, date range label, and a simple dot
 * for the most recent entry.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import type { WeightEntry } from '../../services/profile';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  entries: WeightEntry[];
  /** Chart drawing area height in dp */
  chartHeight?: number;
}

interface Dimensions {
  width: number;
  height: number;
}

function dateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return '';
  }
}

export default function WeightLogChart({
  entries,
  chartHeight = 80,
}: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [dims, setDims] = useState<Dimensions | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDims({ width, height });
  }, []);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No weight data yet</Text>
      </View>
    );
  }

  const weights = entries.map((e) => e.weight_kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const first = entries[0];
  const last = entries[entries.length - 1];

  // Convert entries to (x%, y%) coordinates.
  const toPoints = (w: number, height: number): number =>
    height - ((w - minW) / range) * height;

  const renderSegments = (width: number, height: number) => {
    const segments: React.ReactElement[] = [];
    const n = entries.length;

    for (let i = 0; i < n - 1; i++) {
      const x1 = (i / (n - 1)) * width;
      const y1 = toPoints(entries[i].weight_kg, height);
      const x2 = ((i + 1) / (n - 1)) * width;
      const y2 = toPoints(entries[i + 1].weight_kg, height);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      segments.push(
        <View
          key={i}
          style={[
            styles.segment,
            {
              width: len,
              left: x1,
              top: y1,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />,
      );
    }

    // Dot for most recent
    const lastX = width;
    const lastY = toPoints(last.weight_kg, height);
    segments.push(
      <View
        key="dot"
        style={[styles.dot, { left: lastX - 4, top: lastY - 4 }]}
      />,
    );

    return segments;
  };

  return (
    <View style={styles.container}>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {dateLabel(first.date)} → {dateLabel(last.date)}
        </Text>
        <Text style={[styles.metaText, { color: c.primary }]}>
          {last.weight_kg} kg
        </Text>
      </View>

      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={[styles.yAxis, { height: chartHeight }]}>
          <Text style={styles.axisLabel}>{maxW.toFixed(1)}</Text>
          <Text style={styles.axisLabel}>{minW.toFixed(1)}</Text>
        </View>

        {/* Drawing surface */}
        <View
          style={[styles.surface, { height: chartHeight }]}
          onLayout={onLayout}
        >
          {dims ? renderSegments(dims.width, dims.height) : null}
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaText: {
      ...typography.bodySmall,
      color: c.text3,
    },
    chartArea: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'stretch',
    },
    yAxis: {
      justifyContent: 'space-between',
      width: 36,
    },
    axisLabel: {
      ...typography.caption,
      color: c.text3,
      textAlign: 'right',
    },
    surface: {
      flex: 1,
      backgroundColor: c.bg,
      borderRadius: radius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    segment: {
      position: 'absolute',
      height: 2,
      backgroundColor: c.primary,
      borderRadius: 1,
      transformOrigin: '0 50%',
    },
    dot: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
      borderWidth: 2,
      borderColor: c.surface,
    },
    empty: {
      height: 60,
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      ...typography.bodySmall,
      color: c.text3,
    },
  });
}

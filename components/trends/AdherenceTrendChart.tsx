import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DoseLogEntry } from '../../services/schedule';
import { computeDailyAdherence, computeWoWDelta } from '../../utils/adherenceCalc';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  logs: DoseLogEntry[];
  scheduledPerDay: number;
}

const CHART_HEIGHT = 120;
const DOT_SIZE = 8;

function WoWBadge({ delta, c }: { delta: number; c: ColorPalette }) {
  const isUp = delta > 2;
  const isDown = delta < -2;
  const color = isUp ? c.ok : isDown ? c.danger : c.text3;
  const arrow = isUp ? '↑' : isDown ? '↓' : '→';
  const bg = isUp ? c.okLight : isDown ? c.dangerLight : c.cardSolid;

  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }]}>
      <Text style={[badgeStyles.text, { color }]}>
        {arrow} {delta > 0 ? '+' : ''}{delta}% vs last week
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export function AdherenceTrendChart({ logs, scheduledPerDay }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const data = useMemo(
    () => computeDailyAdherence(logs, scheduledPerDay, 7),
    [logs, scheduledPerDay],
  );

  const wowDelta = useMemo(
    () => computeWoWDelta(logs, scheduledPerDay),
    [logs, scheduledPerDay],
  );

  const daysWithData = data.filter((d) => d.pct > 0).length;
  const showEmptyState = daysWithData < 3;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>7-Day Adherence Trend</Text>
        {wowDelta !== null && <WoWBadge delta={wowDelta} c={c} />}
      </View>

      {showEmptyState ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Log more doses to see your trend</Text>
        </View>
      ) : (
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yLabel}>100%</Text>
            <Text style={styles.yLabel}>50%</Text>
            <Text style={styles.yLabel}>0%</Text>
          </View>

          {/* Chart with dots and connecting lines */}
          <View style={styles.chartBody}>
            {/* Horizontal grid lines */}
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: CHART_HEIGHT / 2 }]} />
            <View style={[styles.gridLine, { top: CHART_HEIGHT }]} />

            {/* Points + connecting lines */}
            <ConnectingLines data={data} chartHeight={CHART_HEIGHT} color={c.primary} />

            {/* Dots */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - d.pct;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      left: `${x}%` as `${number}%`,
                      top: `${y}%` as `${number}%`,
                      backgroundColor: d.pct >= 80 ? c.ok : d.pct >= 50 ? c.primary : c.danger,
                      marginLeft: -(DOT_SIZE / 2),
                      marginTop: -(DOT_SIZE / 2),
                    },
                  ]}
                  accessibilityLabel={`${d.dateLabel}: ${d.pct}% adherence`}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* X-axis labels */}
      {!showEmptyState && (
        <View style={styles.xAxis}>
          {data.map((d, i) => (
            <Text key={i} style={styles.xLabel}>{d.dateLabel}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Draws lines between consecutive data points using rotated Views.
 * Pure RN/web — no SVG library required.
 */
function ConnectingLines({
  data,
  chartHeight,
  color,
}: {
  data: { pct: number }[];
  chartHeight: number;
  color: string;
}) {
  if (data.length < 2) return null;

  return (
    <>
      {data.slice(0, -1).map((_, i) => {
        const a = data[i];
        const b = data[i + 1];
        if (!a || !b) return null;

        // Convert % values to 0-1 fractions; top = (100-pct)/100 in chart coords
        const x1Frac = i / (data.length - 1);
        const x2Frac = (i + 1) / (data.length - 1);
        const y1Frac = (100 - a.pct) / 100;
        const y2Frac = (100 - b.pct) / 100;

        // For the rotated-View approach we need actual pixel offsets.
        // We use the `chartBody` width as 100% — React Native resolves this
        // at render time via the layout measurement. Since we can't know
        // exact width at render time without onLayout, we use a simpler
        // approach: express the line via two absolute-positioned endpoints.
        // The trick: use a 1px wide absolutely-positioned coloured view per segment,
        // stretched between the two y-positions, with the border doing the work.
        // This won't look great for steep angles but is reliable without onLayout.

        // Instead, use a fractional-width approach:
        // - Segment spans from x1Frac to x2Frac of the container width
        // - The line is a View at y1Frac top, height = (y2Frac - y1Frac) * chartHeight
        // For diagonal lines we use a border trick: borderBottom or gradient-like approach.
        // This is actually not easy without onLayout for true diagonals.
        // Best approach: accept that for a 7-point chart, the segments are short and
        // the diagonal angle is gentle enough that a "slanted rectangle" via skew is fine.

        // We'll use transform: [{skewY}] which is supported on both RN and web.
        // For each segment: render a 2px wide segment at x1Frac, with height spanning y-range,
        // and skew to make it diagonal.
        // Actually the simplest correct approach is just calculate the line geometry:

        // Given we know the chartHeight (in points) but not the width, we use a known
        // approximation: each segment width = containerWidth / (n-1).
        // We pass chartHeight but not width. For the web-compatible approach,
        // we'll render each segment as percentage-based vertical range + skew.

        // The cleanest approach that works well for small point counts:
        // Render each segment as a filled parallelogram using border manipulation.
        // For MVP with 7 points this produces acceptable results.

        const top = Math.min(y1Frac, y2Frac) * chartHeight;
        const bottom = Math.max(y1Frac, y2Frac) * chartHeight;
        const segHeight = Math.max(2, bottom - top);
        const goingDown = y2Frac > y1Frac;

        const left = `${x1Frac * 100}%` as `${number}%`;
        const width = `${(x2Frac - x1Frac) * 100}%` as `${number}%`;

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left,
              width,
              top,
              height: segHeight,
              borderTopWidth: goingDown ? 0 : 2,
              borderBottomWidth: goingDown ? 2 : 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderTopColor: color,
              borderBottomColor: color,
              opacity: 0.7,
            }}
          />
        );
      })}
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: c.text,
  },
  chartArea: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: CHART_HEIGHT,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: 34,
    paddingVertical: DOT_SIZE / 2,
  },
  yLabel: {
    fontSize: 10,
    color: c.text3,
    fontWeight: '500',
  },
  chartBody: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: c.border,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingLeft: 42,
  },
  xLabel: {
    fontSize: 10,
    color: c.text3,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    ...typography.bodySmall,
    color: c.text2,
    textAlign: 'center',
  },
});
}

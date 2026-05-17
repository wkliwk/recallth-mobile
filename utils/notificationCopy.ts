/** Returns supplement name truncated to first word + "..." if longer than 20 chars. */
function truncate(name: string): string {
  if (name.length <= 20) return name;
  const firstWord = name.split(' ')[0] ?? name;
  return `${firstWord}...`;
}

/**
 * Returns a context-aware notification body string for a dose reminder.
 * Priority order: freeze > missed yesterday > midnight risk > week milestone
 * > tomorrow milestone > multiple supplements > streak 1–6 > fresh start.
 */
export function getNotificationCopy({
  streak,
  supplements,
  notificationHour,
  freezeActive,
  missedYesterday,
}: {
  streak: number;
  supplements: string[];
  notificationHour: number;
  freezeActive: boolean;
  missedYesterday: boolean;
}): string {
  const primary = truncate(supplements[0] ?? 'supplement');

  // Freeze shield active — highest priority
  if (freezeActive) {
    return `Streak shield active today. Still worth taking your ${primary}.`;
  }

  // Missed yesterday (streak was broken overnight)
  if (missedYesterday) {
    return `Fresh start today. Take ${primary} and rebuild your habit.`;
  }

  // Midnight at risk — streak >= 10 AND notification fires within 2 hours of midnight
  const minutesUntilMidnight = (24 - notificationHour) * 60;
  if (streak >= 10 && minutesUntilMidnight < 120) {
    return `${streak}-day streak at risk. You have until midnight — ${primary}.`;
  }

  // 7-day milestone (fires on the day they hit 7, before or during the streak)
  if (streak === 7) {
    return `One week strong. Don't break it tonight — ${primary} time.`;
  }

  // Milestone-tomorrow variants (streak is one before the milestone)
  const MILESTONES = [14, 30, 60, 90] as const;
  for (const m of MILESTONES) {
    if (streak === m - 1) {
      return `${m}-day milestone tomorrow. Take ${primary} to get there.`;
    }
  }

  // Multiple supplements in slot
  if (supplements.length >= 2) {
    const s1 = truncate(supplements[0] ?? '');
    const s2 = truncate(supplements[1] ?? '');
    const extras = supplements.length - 2;
    return extras > 0
      ? `Morning stack: ${s1}, ${s2} + ${extras} more. One tap to log all.`
      : `Morning stack: ${s1}, ${s2}. One tap to log all.`;
  }

  // Streak 1–6
  if (streak >= 1 && streak <= 6) {
    return `Day ${streak} streak — ${primary} is waiting. Keep it going.`;
  }

  // Fresh start (streak === 0 or no streak yet)
  return `Day 1 starts now. Take ${primary} and build the habit.`;
}

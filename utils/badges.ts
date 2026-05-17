export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  shareText: string;
}

export interface EarnedBadge {
  id: string;
  earnedAt: string; // ISO date
}

export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365] as const;

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'streak_7',
    label: '7-Day Streak',
    description: 'Logged every day for a full week',
    icon: '🔥',
    shareText: "I just hit a 7-day streak on Recallth! My supplement habit is building 💊",
  },
  {
    id: 'streak_14',
    label: '14-Day Streak',
    description: 'Two full weeks of consistent logging',
    icon: '⚡',
    shareText: "14 days in a row on Recallth. Half a month strong 💪",
  },
  {
    id: 'streak_30',
    label: '30-Day Streak',
    description: 'A full month of showing up for your health',
    icon: '⭐',
    shareText: "I just hit a 30-day streak on Recallth! One full month of supplement tracking 🌟",
  },
  {
    id: 'streak_60',
    label: '60-Day Streak',
    description: 'Two months of daily logging — a real habit',
    icon: '🚀',
    shareText: "60 days on Recallth without missing a day. This is a real habit now 🚀",
  },
  {
    id: 'streak_100',
    label: '100-Day Streak',
    description: '100 days strong — legendary commitment',
    icon: '🏆',
    shareText: "100-day streak on Recallth! I've built a legendary supplement habit 🏆",
  },
  {
    id: 'streak_365',
    label: '1-Year Streak',
    description: 'A full year of daily supplement tracking',
    icon: '👑',
    shareText: "One year on Recallth without missing a single day. Health is a lifestyle 👑",
  },
  {
    id: 'stack_starter',
    label: 'Stack Starter',
    description: 'Added your first supplement to the cabinet',
    icon: '💊',
    shareText: "Just started tracking my supplements on Recallth — day 1 of building a healthier me!",
  },
  {
    id: 'perfect_week',
    label: 'Perfect Week',
    description: '7 consecutive days logging 100% of scheduled doses',
    icon: '✨',
    shareText: "Perfect week on Recallth — logged every single dose for 7 days straight ✨",
  },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGE_DEFS.find((b) => b.id === id);
}

export function streakBadgeId(days: number): string {
  return `streak_${days}`;
}

export function computeNewlyEarned(
  currentStreak: number,
  cabinetItemCount: number,
  alreadyEarned: string[],
): string[] {
  const newBadges: string[] = [];
  const earned = new Set(alreadyEarned);

  // Streak milestones
  for (const m of STREAK_MILESTONES) {
    const id = streakBadgeId(m);
    if (!earned.has(id) && currentStreak >= m) {
      newBadges.push(id);
    }
  }

  // Stack Starter
  if (!earned.has('stack_starter') && cabinetItemCount > 0) {
    newBadges.push('stack_starter');
  }

  // Note: perfect_week is computed separately from dose logs
  return newBadges;
}

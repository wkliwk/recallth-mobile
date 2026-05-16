// Static mock data for Summary screen — API will be wired in a follow-up issue.

export type TimeBlock = 'morning' | 'midday' | 'evening' | 'night';

export type SupplementEntry = {
  id: string;
  name: string;
  dose: string;
  timeBlock: TimeBlock;
  taken: boolean;
  doseLogId?: string;
};

export const MOCK_SUPPLEMENTS: SupplementEntry[] = [
  { id: '1', name: 'Vitamin D3', dose: '2000 IU', timeBlock: 'morning', taken: true },
  { id: '2', name: 'Omega-3 EPA/DHA', dose: '1000 mg', timeBlock: 'morning', taken: true },
  { id: '3', name: 'Creatine monohydrate', dose: '5 g', timeBlock: 'morning', taken: true },
  { id: '4', name: 'Magnesium glycinate', dose: '200 mg', timeBlock: 'midday', taken: false },
  { id: '5', name: 'B-complex', dose: '1 cap', timeBlock: 'midday', taken: false },
  { id: '6', name: 'Caffeine + L-theanine', dose: '100 + 200 mg', timeBlock: 'evening', taken: false },
  { id: '7', name: 'Ashwagandha KSM-66', dose: '600 mg', timeBlock: 'night', taken: false },
];

export const TIME_BLOCK_LABELS: Record<TimeBlock, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  night: 'Night',
};

export const TIME_BLOCK_ORDER: TimeBlock[] = ['morning', 'midday', 'evening', 'night'];

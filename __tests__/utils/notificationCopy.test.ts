import { getNotificationCopy } from '../../utils/notificationCopy';

const base = {
  streak: 0,
  supplements: ['Vitamin D'],
  notificationHour: 9,
  freezeActive: false,
  missedYesterday: false,
};

test('freeze active — highest priority', () => {
  const result = getNotificationCopy({ ...base, streak: 30, freezeActive: true });
  expect(result).toBe('Streak shield active today. Still worth taking your Vitamin D.');
});

test('missed yesterday — fresh start', () => {
  const result = getNotificationCopy({ ...base, streak: 0, missedYesterday: true });
  expect(result).toBe('Fresh start today. Take Vitamin D and rebuild your habit.');
});

test('streak at risk near midnight (streak >= 10, hour = 23)', () => {
  const result = getNotificationCopy({ ...base, streak: 15, notificationHour: 23 });
  expect(result).toBe('15-day streak at risk. You have until midnight — Vitamin D.');
});

test('streak not at risk when more than 2 hours to midnight (hour = 9)', () => {
  const result = getNotificationCopy({ ...base, streak: 15, notificationHour: 9 });
  // Falls through to streak 1–6 check → streak=15 doesn't match, falls to fresh start
  expect(result).not.toContain('streak at risk');
});

test('7-day milestone', () => {
  const result = getNotificationCopy({ ...base, streak: 7 });
  expect(result).toBe("One week strong. Don't break it tonight — Vitamin D time.");
});

test('14-day milestone tomorrow (streak = 13)', () => {
  const result = getNotificationCopy({ ...base, streak: 13 });
  expect(result).toBe('14-day milestone tomorrow. Take Vitamin D to get there.');
});

test('30-day milestone tomorrow (streak = 29)', () => {
  const result = getNotificationCopy({ ...base, streak: 29 });
  expect(result).toBe('30-day milestone tomorrow. Take Vitamin D to get there.');
});

test('multiple supplements — two items', () => {
  const result = getNotificationCopy({ ...base, supplements: ['Vitamin D', 'Omega 3'] });
  expect(result).toBe('Morning stack: Vitamin D, Omega 3. One tap to log all.');
});

test('multiple supplements — three or more shows extras count', () => {
  const result = getNotificationCopy({
    ...base,
    supplements: ['Vitamin D', 'Omega 3', 'Magnesium'],
  });
  expect(result).toBe('Morning stack: Vitamin D, Omega 3 + 1 more. One tap to log all.');
});

test('streak 1–6 shows day number', () => {
  const result = getNotificationCopy({ ...base, streak: 4 });
  expect(result).toBe('Day 4 streak — Vitamin D is waiting. Keep it going.');
});

test('fresh start (streak = 0)', () => {
  const result = getNotificationCopy({ ...base, streak: 0 });
  expect(result).toBe('Day 1 starts now. Take Vitamin D and build the habit.');
});

test('long supplement name is truncated', () => {
  const result = getNotificationCopy({
    ...base,
    streak: 0,
    supplements: ['Acetyl-L-Carnitine HCl 500mg'],
  });
  expect(result).toBe('Day 1 starts now. Take Acetyl-L-Carnitine... and build the habit.');
});

test('freeze flag takes priority over missedYesterday', () => {
  const result = getNotificationCopy({ ...base, freezeActive: true, missedYesterday: true });
  expect(result).toContain('Streak shield');
});

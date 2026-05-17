import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ProgressCardData {
  streak: number;
  weeklyAdherencePct: number;
  activeSuppCount: number;
}

function buildHtml(data: ProgressCardData): string {
  const { streak, weeklyAdherencePct, activeSuppCount } = data;
  const adherenceStr = `${Math.round(weeklyAdherencePct)}%`;
  const streakLabel = streak === 1 ? 'day streak' : 'day streak';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=800,initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 800px; height: 800px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #1a2a1a 0%, #0f1f0f 50%, #162416 100%);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .card {
    width: 720px; height: 720px;
    background: linear-gradient(145deg, rgba(76,153,76,0.15) 0%, rgba(26,42,26,0) 60%);
    border: 1px solid rgba(76,153,76,0.3);
    border-radius: 48px;
    padding: 72px 64px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute; top: -120px; right: -120px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%);
  }
  .header {
    display: flex; flex-direction: column; gap: 8px;
  }
  .app-name {
    font-size: 20px; font-weight: 700; letter-spacing: 3px;
    color: rgba(76,175,80,0.8); text-transform: uppercase;
  }
  .tagline {
    font-size: 15px; color: rgba(255,255,255,0.4); font-weight: 400;
  }
  .main-stat {
    display: flex; flex-direction: column; align-items: flex-start;
    gap: 4px;
  }
  .streak-number {
    font-size: 120px; font-weight: 800; color: #4caf50;
    line-height: 1; letter-spacing: -6px;
  }
  .streak-label {
    font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.6);
    letter-spacing: 1px; text-transform: uppercase; margin-top: -8px;
  }
  .stats-row {
    display: flex; gap: 40px;
  }
  .stat {
    display: flex; flex-direction: column; gap: 6px;
  }
  .stat-value {
    font-size: 36px; font-weight: 700; color: #fff;
  }
  .stat-label {
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 1px;
  }
  .footer {
    display: flex; align-items: center; justify-content: space-between;
  }
  .cta {
    font-size: 14px; color: rgba(255,255,255,0.35);
  }
  .flame { font-size: 64px; line-height: 1; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="app-name">Recallth</div>
    <div class="tagline">My supplement progress</div>
  </div>

  <div style="display:flex; align-items:center; gap:24px;">
    <div class="flame">🔥</div>
    <div class="main-stat">
      <div class="streak-number">${streak}</div>
      <div class="streak-label">${streakLabel}</div>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat">
      <div class="stat-value">${adherenceStr}</div>
      <div class="stat-label">Weekly adherence</div>
    </div>
    <div class="stat">
      <div class="stat-value">${activeSuppCount}</div>
      <div class="stat-label">Active supplements</div>
    </div>
  </div>

  <div class="footer">
    <div class="cta">recallth.app</div>
  </div>
</div>
</body>
</html>`;
}

export async function shareProgressCard(data: ProgressCardData): Promise<void> {
  const html = buildHtml(data);
  const { uri } = await Print.printToFileAsync({ html, width: 800, height: 800 });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your progress',
    UTI: 'com.adobe.pdf',
  });
}

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { listCabinetItems, getInteractions, type CabinetItem } from './cabinet';
import { getMonthlySummary } from './insights';
import { buildReportHtml } from '../utils/reportTemplate';
import { badgeById, type EarnedBadge } from '../utils/badges';

export async function shareProgressCard(streak: number, earnedBadges: EarnedBadge[]): Promise<void> {
  const topBadge = earnedBadges.length > 0 ? badgeById(earnedBadges[earnedBadges.length - 1].id) : null;
  const today = new Date().toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{margin:0;padding:0;background:#0f172a;font-family:-apple-system,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.card{width:320px;background:#1e293b;border-radius:24px;padding:32px;color:#f1f5f9;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);}
.logo{font-size:13px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;}
.badge-icon{font-size:56px;margin-bottom:8px;}
.badge-label{font-size:14px;font-weight:600;color:#94a3b8;margin-bottom:24px;}
.streak-num{font-size:72px;font-weight:800;color:#38bdf8;line-height:1;}
.streak-label{font-size:16px;color:#94a3b8;margin-top:4px;margin-bottom:24px;}
.divider{border:none;border-top:1px solid #334155;margin:0 0 16px;}
.badges-count{font-size:13px;color:#64748b;}
.date{font-size:11px;color:#475569;margin-top:20px;}
</style></head>
<body><div class="card">
<div class="logo">Recallth</div>
${topBadge ? `<div class="badge-icon">${topBadge.icon}</div><div class="badge-label">${topBadge.label}</div>` : ''}
<div class="streak-num">${streak}</div>
<div class="streak-label">day streak 🔥</div>
<hr class="divider">
<div class="badges-count">${earnedBadges.length} badge${earnedBadges.length !== 1 ? 's' : ''} earned</div>
<div class="date">${today}</div>
</div></body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your Recallth progress',
    UTI: 'com.adobe.pdf',
  });
}

export async function generateAndShareReport(token: string, userName: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const prevMonth = new Date();
  prevMonth.setDate(0); // last day of prev month
  const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const [items, interactionsData, monthlySummary] = await Promise.all([
    listCabinetItems(token),
    getInteractions(token).catch(() => []),
    getMonthlySummary(token, monthStr).catch(() => null),
  ]);

  const html = buildReportHtml({
    userName,
    exportDate: today,
    supplements: items,
    adherence: monthlySummary?.supplements ?? [],
    interactions: interactionsData.map((ix) => ({
      supplementA: ix.item1,
      supplementB: ix.item2,
      description: ix.description,
    })),
    aiInsight: monthlySummary?.aiInsight ?? null,
  });

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share Supplement Report',
    UTI: 'com.adobe.pdf',
  });
}

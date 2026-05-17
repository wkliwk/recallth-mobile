import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { listCabinetItems, getInteractions, type CabinetItem } from './cabinet';
import { getMonthlySummary } from './insights';
import { buildReportHtml } from '../utils/reportTemplate';

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

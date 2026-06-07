import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { setWidgetData, reloadWidget } from './WidgetDataModule';

interface UseWidgetSyncParams {
  dosesTaken: number;
  dosesTotal: number;
  streak: number;
  nextDoseName: string;
  nextDoseTime: string;
  isLoggedIn: boolean;
}

export function useWidgetSync({
  dosesTaken,
  dosesTotal,
  streak,
  nextDoseName,
  nextDoseTime,
  isLoggedIn,
}: UseWidgetSyncParams): void {
  const lastWritten = useRef<string>('');

  function buildPayload(now: Date) {
    return {
      dosesTaken,
      dosesTotal,
      streak,
      nextDoseName,
      nextDoseTime,
      isLoggedIn,
      date: now.toISOString().split('T')[0] as string,
    };
  }

  useEffect(() => {
    const now = new Date();
    const payload = JSON.stringify(buildPayload(now));
    if (payload === lastWritten.current) return;
    lastWritten.current = payload;
    setWidgetData(buildPayload(now));
    reloadWidget();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dosesTaken, dosesTotal, streak, nextDoseName, nextDoseTime, isLoggedIn]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const now = new Date();
      setWidgetData(buildPayload(now));
      reloadWidget();
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dosesTaken, dosesTotal, streak, nextDoseName, nextDoseTime, isLoggedIn]);
}

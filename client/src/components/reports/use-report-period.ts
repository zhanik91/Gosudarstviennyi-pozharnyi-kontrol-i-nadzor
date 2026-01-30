import { useEffect, useMemo } from "react";
import { PeriodPreset, usePeriodStore } from "@/hooks/use-period-store";

const formatMonth = (value: number) => String(value).padStart(2, "0");

const getPresetPeriodKey = (preset: PeriodPreset) => {
  const candidate = preset.from || preset.to;
  if (!candidate) return "";
  return candidate.slice(0, 7);
};

export function useReportPeriod() {
  const { store, updatePreset } = usePeriodStore();
  const fallbackDate = useMemo(() => new Date(), []);
  const fallbackKey = useMemo(
    () => `${fallbackDate.getFullYear()}-${formatMonth(fallbackDate.getMonth() + 1)}`,
    [fallbackDate],
  );
  const periodKey = useMemo(
    () => getPresetPeriodKey(store.report) || fallbackKey,
    [store.report, fallbackKey],
  );
  const [reportYear, reportMonth] = periodKey.split("-");

  useEffect(() => {
    if (!store.report.from && !store.report.to) {
      const seededDate = `${periodKey}-01`;
      updatePreset("report", { from: seededDate, to: seededDate });
    }
  }, [periodKey, store.report.from, store.report.to, updatePreset]);

  const setReportMonth = (nextMonth: string) => {
    const nextYear = reportYear || fallbackKey.split("-")[0];
    const nextDate = `${nextYear}-${nextMonth}-01`;
    updatePreset("report", { from: nextDate, to: nextDate });
  };

  const setReportYear = (nextYear: string) => {
    const nextMonth = reportMonth || fallbackKey.split("-")[1];
    const nextDate = `${nextYear}-${nextMonth}-01`;
    updatePreset("report", { from: nextDate, to: nextDate });
  };

  const setReportPeriodKey = (nextPeriod: string) => {
    if (!nextPeriod) return;
    const nextDate = `${nextPeriod}-01`;
    updatePreset("report", { from: nextDate, to: nextDate });
  };

  return {
    store,
    updatePreset,
    periodKey,
    reportMonth,
    reportYear,
    setReportMonth,
    setReportYear,
    setReportPeriodKey,
  };
}

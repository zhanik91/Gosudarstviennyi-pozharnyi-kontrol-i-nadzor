import { useCallback, useEffect, useState } from "react";

export type PeriodPresetKey = "journal" | "report" | "analytics";

export type PeriodPreset = {
  from: string;
  to: string;
};

type PeriodStore = Record<PeriodPresetKey, PeriodPreset>;

const PERIOD_STORAGE_KEY = "fire_period_store_v1";
const PERIOD_STORE_EVENT = "fire-period-store-update";

const emptyPreset = (): PeriodPreset => ({ from: "", to: "" });

const createDefaultStore = (): PeriodStore => ({
  journal: emptyPreset(),
  report: emptyPreset(),
  analytics: emptyPreset(),
});

const normalizePreset = (value: unknown): PeriodPreset => {
  if (!value || typeof value !== "object") return emptyPreset();
  const record = value as Record<string, unknown>;
  return {
    from: typeof record.from === "string" ? record.from : "",
    to: typeof record.to === "string" ? record.to : "",
  };
};

const normalizeStore = (value: unknown): PeriodStore => {
  const fallback = createDefaultStore();
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    journal: normalizePreset(record.journal),
    report: normalizePreset(record.report),
    analytics: normalizePreset(record.analytics),
  };
};

const readPeriodStore = (): PeriodStore => {
  if (typeof window === "undefined") {
    return createDefaultStore();
  }
  const raw = window.localStorage.getItem(PERIOD_STORAGE_KEY);
  if (!raw) return createDefaultStore();
  try {
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to parse period store:", error);
    return createDefaultStore();
  }
};

const writePeriodStore = (next: PeriodStore) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PERIOD_STORE_EVENT));
};

export function usePeriodStore() {
  const [store, setStore] = useState<PeriodStore>(() => readPeriodStore());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      setStore(readPeriodStore());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PERIOD_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PERIOD_STORE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PERIOD_STORE_EVENT, sync);
    };
  }, []);

  const updatePreset = useCallback((key: PeriodPresetKey, next: PeriodPreset) => {
    const current = readPeriodStore();
    const updated: PeriodStore = {
      ...current,
      [key]: {
        ...current[key],
        ...next,
      },
    };
    setStore(updated);
    writePeriodStore(updated);
  }, []);

  return { store, updatePreset };
}

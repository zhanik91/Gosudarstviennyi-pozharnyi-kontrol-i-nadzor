export const TIME_OF_DAY_BUCKETS = [
  "00:00-06:00",
  "06:00-12:00",
  "12:00-18:00",
  "18:00-24:00",
] as const;

export type TimeOfDayBucket = (typeof TIME_OF_DAY_BUCKETS)[number];

const TIME_OF_DAY_ALIASES: Record<string, TimeOfDayBucket> = {
  "00:00-06:00": "00:00-06:00",
  "0:00-6:00": "00:00-06:00",
  "0-6": "00:00-06:00",
  "ночь": "00:00-06:00",
  night: "00:00-06:00",

  "06:00-12:00": "06:00-12:00",
  "6:00-12:00": "06:00-12:00",
  "6-12": "06:00-12:00",
  "утро": "06:00-12:00",
  morning: "06:00-12:00",

  "12:00-18:00": "12:00-18:00",
  "12-18": "12:00-18:00",
  "день": "12:00-18:00",
  day: "12:00-18:00",

  "18:00-24:00": "18:00-24:00",
  "18-24": "18:00-24:00",
  "18:00-00:00": "18:00-24:00",
  "вечер": "18:00-24:00",
  evening: "18:00-24:00",
};

const toValidDate = (value: Date | string | number): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTimeOfDayBucketFromDate = (
  value: Date | string | number | null | undefined,
): TimeOfDayBucket | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const date = toValidDate(value);
  if (!date) return undefined;

  const hours = date.getHours();
  if (hours < 6) return "00:00-06:00";
  if (hours < 12) return "06:00-12:00";
  if (hours < 18) return "12:00-18:00";
  return "18:00-24:00";
};

export const normalizeTimeOfDayBucket = (value: unknown): TimeOfDayBucket | undefined => {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;

  return TIME_OF_DAY_ALIASES[normalized];
};

export const resolveTimeOfDayBucket = (params: {
  dateTime?: Date | string | number | null;
  timeOfDay?: unknown;
}): TimeOfDayBucket | undefined => {
  return getTimeOfDayBucketFromDate(params.dateTime) ?? normalizeTimeOfDayBucket(params.timeOfDay);
};

export const VICTIM_GENDER_OPTIONS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
] as const;

export const VICTIM_AGE_GROUP_OPTIONS = [
  { value: "child", label: "Ребенок (до 18)" },
  { value: "adult", label: "Взрослый (18-60)" },
  { value: "pensioner", label: "Пенсионер (>60)" },
] as const;

export const VICTIM_SOCIAL_STATUS_OPTIONS = [
  { value: "worker", label: "Рабочий" },
  { value: "employee", label: "Служащий" },
  { value: "entrepreneur", label: "Предприниматель" },
  { value: "unemployed", label: "Временно неработающий" },
  { value: "pensioner", label: "Пенсионер" },
  { value: "child", label: "Дети дошкольного возраста" },
  { value: "student_7_10", label: "Учащиеся (7-10 лет)" },
  { value: "student_10_16", label: "Учащиеся (10-16 лет)" },
  { value: "student", label: "Студент (старше 16 лет)" },
  { value: "homeless", label: "Лицо без определенного места жительства" },
  { value: "prisoner", label: "Лицо в местах лишения свободы" },
  { value: "disabled", label: "Лицо с инвалидностью" },
] as const;

export const VICTIM_STATUS_OPTIONS = [
  { value: "dead", label: "Погиб" },
  { value: "injured", label: "Травмирован" },
  { value: "saved", label: "Спасен" },
] as const;

export const VICTIM_CONDITION_OPTIONS = [
  { value: "alcohol", label: "Алкогольное опьянение" },
  { value: "sleep", label: "Состояние сна" },
  { value: "disability", label: "Инвалидность" },
  { value: "unattended_children", label: "Оставленные без присмотра дети" },
  { value: "panic", label: "Паника" },
  { value: "other", label: "Другое" },
] as const;

export const VICTIM_DEATH_CAUSE_OPTIONS = [
  { value: "high_temp", label: "Высокая температура" },
  { value: "smoke", label: "Воздействие продуктов горения" },
  { value: "collapse", label: "Обрушение" },
  { value: "panic", label: "Психологические факторы" },
  { value: "gas_explosion", label: "Взрыв газа" },
  { value: "other", label: "Другое" },
] as const;

export const VICTIM_DEATH_PLACE_OPTIONS = [
  { value: "on_site", label: "На месте происшествия" },
  { value: "hospital", label: "В медицинском учреждении" },
  { value: "en_route", label: "В пути (при транспортировке)" },
  { value: "other", label: "Другое" },
] as const;

export const FORM_5_SOCIAL_STATUS_TO_ROW: Record<string, string> = {
  worker: "2.1.1",
  employee: "2.1.2",
  entrepreneur: "2.1.3",
  unemployed: "2.1.4",
  pensioner: "2.1.5",
  child: "2.1.6",
  student_7_10: "2.1.7.1",
  student_10_16: "2.1.7.2",
  student: "2.1.8",
  homeless: "2.1.9",
  disabled: "2.1.10",
};

export const FORM_5_CONDITION_TO_ROW: Record<string, string> = {
  alcohol: "3.1.1",
  sleep: "3.1.2",
  disability: "3.1.3",
  unattended_children: "3.1.4",
  panic: "3.1.5",
  other: "3.1.6",
};

export const FORM_5_DEATH_CAUSE_TO_ROW: Record<string, string> = {
  high_temp: "4.1.1",
  smoke: "4.1.2",
  collapse: "4.1.3",
  panic: "4.1.4",
  gas_explosion: "4.1.5",
  other: "4.1.6",
};

export const FORM_5_DEATH_PLACE_TO_ROW: Record<string, string> = {
  on_site: "5.1.1",
  en_route: "5.1.2",
  hospital: "5.1.3",
};

export const FORM_7_DEAD_SOCIAL_STATUS_TO_ROW: Record<string, string> = {
  worker: "2.1",
  employee: "2.2",
  entrepreneur: "2.3",
  unemployed: "2.4",
  pensioner: "2.5",
  child: "2.6",
  student_7_10: "2.7.1",
  student_10_16: "2.7.2",
  student: "2.8",
  homeless: "2.9",
  prisoner: "2.10",
  disabled: "2.11",
};

export const FORM_7_INJURED_SOCIAL_STATUS_TO_ROW: Record<string, string> = {
  worker: "12.1",
  employee: "12.2",
  entrepreneur: "12.3",
  unemployed: "12.4",
  pensioner: "12.5",
  child: "12.6",
  student_7_10: "12.7.1",
  student_10_16: "12.7.2",
  student: "12.8",
  homeless: "12.9",
  prisoner: "12.10",
  disabled: "12.11",
};

export const FORM_7_DEAD_CONDITION_TO_ROW: Record<string, string> = {
  alcohol: "3.1",
  sleep: "3.2",
  disability: "3.3",
  unattended_children: "3.4",
  other: "3.5",
};

export const FORM_7_INJURED_CONDITION_TO_ROW: Record<string, string> = {
  alcohol: "13.1",
  sleep: "13.2",
  disability: "13.3",
  unattended_children: "13.4",
  other: "13.5",
};

export const LEGACY_INCIDENT_VICTIM_VALUE_MAPS = {
  socialStatus: {
    child_preschool: "child",
    student_school: "student_10_16",
    student_uni: "student",
  },
  condition: {
    unsupervised_child: "unattended_children",
  },
  deathCause: {
    combustion_products: "smoke",
    psych: "panic",
  },
} as const;

export type IncidentVictimNormalizationField = keyof typeof LEGACY_INCIDENT_VICTIM_VALUE_MAPS;

export function normalizeIncidentVictimValue(
  field: IncidentVictimNormalizationField,
  value: string | null | undefined,
): string | null | undefined {
  if (!value) {
    return value;
  }

  return LEGACY_INCIDENT_VICTIM_VALUE_MAPS[field][value as never] ?? value;
}

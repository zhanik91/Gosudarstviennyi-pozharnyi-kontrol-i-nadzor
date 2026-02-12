import { FORM_4_SOVP_ROWS } from "@shared/fire-forms-data";

export type Form7CoObjectRows = {
  deadRowId: string;
  injuredRowId: string;
  fallback: boolean;
};

export const FORM_7_CO_OBJECT_OTHER_ROWS: Form7CoObjectRows = {
  deadRowId: "5.12",
  injuredRowId: "15.12",
  fallback: true,
};

const FORM_7_CO_OBJECT_OTHER_ROWS_EXPLICIT: Form7CoObjectRows = {
  deadRowId: "5.12",
  injuredRowId: "15.12",
  fallback: false,
};

const FORM_7_CO_OBJECT_BASE_ROWS_BY_CODE: Record<string, Form7CoObjectRows> = {
  "9.1": { deadRowId: "5.4", injuredRowId: "15.4", fallback: false },
  "9.2": { deadRowId: "5.5", injuredRowId: "15.5", fallback: false },
  "11.3": { deadRowId: "5.9", injuredRowId: "15.9", fallback: false },
  "14.1": { deadRowId: "5.7", injuredRowId: "15.7", fallback: false },
  "14.1.1": { deadRowId: "5.4", injuredRowId: "15.4", fallback: false },
  "14.1.2": { deadRowId: "5.3", injuredRowId: "15.3", fallback: false },
  "14.1.3": { deadRowId: "5.10", injuredRowId: "15.10", fallback: false },
  "14.2": { deadRowId: "5.1", injuredRowId: "15.1", fallback: false },
  "14.3": { deadRowId: "5.2", injuredRowId: "15.2", fallback: false },
  "14.4": { deadRowId: "5.1", injuredRowId: "15.1", fallback: false },
  "14.5": { deadRowId: "5.2", injuredRowId: "15.2", fallback: false },
  "14.6": { deadRowId: "5.6", injuredRowId: "15.6", fallback: false },
  "14.7": { deadRowId: "5.11", injuredRowId: "15.11", fallback: false },
};

type ClassifierRow = { id: string; children?: ClassifierRow[] };

function flattenForm4Codes(rows: ClassifierRow[]): string[] {
  const result: string[] = [];
  const stack = [...rows];

  while (stack.length > 0) {
    const row = stack.pop();
    if (!row) continue;
    result.push(row.id);
    if (row.children?.length) {
      stack.push(...row.children);
    }
  }

  return result;
}

const FORM_4_SOVP_CODES = flattenForm4Codes(FORM_4_SOVP_ROWS);

export const FORM_7_CO_OBJECT_ROWS_BY_CODE: Record<string, Form7CoObjectRows> = {
  ...FORM_4_SOVP_CODES.reduce(
    (acc, code) => {
      acc[code] = FORM_7_CO_OBJECT_OTHER_ROWS_EXPLICIT;
      return acc;
    },
    {} as Record<string, Form7CoObjectRows>,
  ),
  ...FORM_7_CO_OBJECT_BASE_ROWS_BY_CODE,
};

const MAPPING_SCOPE = "[Form7CO:ObjectMapping]";
let fallbackTriggerCount = 0;

type CoObjectMappingLogger = (message: string, meta?: Record<string, unknown>) => void;

export function mapCoObjectCodeToForm7Rows(
  code: string | null | undefined,
  logger: CoObjectMappingLogger = (message, meta) => console.warn(message, meta),
): Form7CoObjectRows {
  const normalized = code?.trim();

  if (!normalized) {
    fallbackTriggerCount += 1;
    logger(`${MAPPING_SCOPE} Empty object code, fallback to 'прочие / не классифицировано'.`, {
      code,
      fallbackTriggerCount,
      fallbackRows: FORM_7_CO_OBJECT_OTHER_ROWS,
    });
    return FORM_7_CO_OBJECT_OTHER_ROWS;
  }

  const mapped = FORM_7_CO_OBJECT_ROWS_BY_CODE[normalized];
  if (mapped) {
    return mapped;
  }

  fallbackTriggerCount += 1;
  logger(`${MAPPING_SCOPE} Unrecognized object code, fallback to 'прочие / не классифицировано'.`, {
    code: normalized,
    fallbackTriggerCount,
    fallbackRows: FORM_7_CO_OBJECT_OTHER_ROWS,
  });

  return FORM_7_CO_OBJECT_OTHER_ROWS;
}

export function getForm7CoObjectFallbackTriggerCount(): number {
  return fallbackTriggerCount;
}

export function resetForm7CoObjectFallbackTriggerCount(): void {
  fallbackTriggerCount = 0;
}

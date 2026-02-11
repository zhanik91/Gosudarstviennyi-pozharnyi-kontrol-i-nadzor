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

export const FORM_7_CO_OBJECT_ROWS_BY_CODE: Record<string, Form7CoObjectRows> = {
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

const MAPPING_SCOPE = "[Form7CO:ObjectMapping]";

type CoObjectMappingLogger = (message: string, meta?: Record<string, unknown>) => void;

export function mapCoObjectCodeToForm7Rows(
  code: string | null | undefined,
  logger: CoObjectMappingLogger = (message, meta) => console.warn(message, meta),
): Form7CoObjectRows {
  const normalized = code?.trim();

  if (!normalized) {
    logger(`${MAPPING_SCOPE} Empty object code, fallback to 'прочие / не классифицировано'.`, {
      code,
      fallbackRows: FORM_7_CO_OBJECT_OTHER_ROWS,
    });
    return FORM_7_CO_OBJECT_OTHER_ROWS;
  }

  const mapped = FORM_7_CO_OBJECT_ROWS_BY_CODE[normalized];
  if (mapped) {
    return mapped;
  }

  logger(`${MAPPING_SCOPE} Unrecognized object code, fallback to 'прочие / не классифицировано'.`, {
    code: normalized,
    fallbackRows: FORM_7_CO_OBJECT_OTHER_ROWS,
  });

  return FORM_7_CO_OBJECT_OTHER_ROWS;
}

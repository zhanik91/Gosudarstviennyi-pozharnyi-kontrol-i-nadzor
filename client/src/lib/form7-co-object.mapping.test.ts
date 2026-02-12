import { describe, expect, it, vi } from "vitest";
import {
  FORM_7_CO_OBJECT_OTHER_ROWS,
  FORM_7_CO_OBJECT_ROWS_BY_CODE,
  getForm7CoObjectFallbackTriggerCount,
  mapCoObjectCodeToForm7Rows,
  resetForm7CoObjectFallbackTriggerCount,
} from "@shared/mappings/form7-co-object.mapping";
import { FORM_4_SOVP_ROWS } from "@shared/fire-forms-data";

type ClassifierRow = { id: string; children?: ClassifierRow[] };

function flattenCodes(rows: ClassifierRow[]): string[] {
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

const form4Codes = flattenCodes(FORM_4_SOVP_ROWS);

describe("form 7 CO object deterministic mapping", () => {
  it("covers the full Form 4 object classifier code list", () => {
    for (const code of form4Codes) {
      expect(FORM_7_CO_OBJECT_ROWS_BY_CODE[code]).toBeDefined();
    }
  });

  it("contains explicit row mapping for known incident object codes", () => {
    expect(FORM_7_CO_OBJECT_ROWS_BY_CODE["9.2"]).toEqual({
      deadRowId: "5.5",
      injuredRowId: "15.5",
      fallback: false,
    });
    expect(FORM_7_CO_OBJECT_ROWS_BY_CODE["11.3"]).toEqual({
      deadRowId: "5.9",
      injuredRowId: "15.9",
      fallback: false,
    });
    expect(FORM_7_CO_OBJECT_ROWS_BY_CODE["14.1"]).toEqual({
      deadRowId: "5.7",
      injuredRowId: "15.7",
      fallback: false,
    });
    expect(FORM_7_CO_OBJECT_ROWS_BY_CODE["14.1.2"]).toEqual({
      deadRowId: "5.3",
      injuredRowId: "15.3",
      fallback: false,
    });
    expect(FORM_7_CO_OBJECT_ROWS_BY_CODE["14.7"]).toEqual({
      deadRowId: "5.11",
      injuredRowId: "15.11",
      fallback: false,
    });
  });

  it("returns direct mapping for known codes", () => {
    expect(mapCoObjectCodeToForm7Rows("2.1")).toEqual({
      deadRowId: "5.12",
      injuredRowId: "15.12",
      fallback: false,
    });
    expect(mapCoObjectCodeToForm7Rows("14.4")).toEqual({
      deadRowId: "5.1",
      injuredRowId: "15.1",
      fallback: false,
    });
  });

  it("routes unknown code to 'прочие / не классифицировано' and logs", () => {
    resetForm7CoObjectFallbackTriggerCount();
    const logger = vi.fn();
    const result = mapCoObjectCodeToForm7Rows("99.99", logger);

    expect(result).toEqual(FORM_7_CO_OBJECT_OTHER_ROWS);
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0]?.[0]).toContain("Unrecognized object code");
    expect(logger.mock.calls[0]?.[1]).toMatchObject({ fallbackTriggerCount: 1 });
    expect(getForm7CoObjectFallbackTriggerCount()).toBe(1);
  });

  it("routes empty code to fallback and logs", () => {
    resetForm7CoObjectFallbackTriggerCount();
    const logger = vi.fn();
    const result = mapCoObjectCodeToForm7Rows("  ", logger);

    expect(result).toEqual(FORM_7_CO_OBJECT_OTHER_ROWS);
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0]?.[0]).toContain("Empty object code");
    expect(logger.mock.calls[0]?.[1]).toMatchObject({ fallbackTriggerCount: 1 });
    expect(getForm7CoObjectFallbackTriggerCount()).toBe(1);
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  FORM_7_CO_OBJECT_OTHER_ROWS,
  FORM_7_CO_OBJECT_ROWS_BY_CODE,
  mapCoObjectCodeToForm7Rows,
} from "@shared/mappings/form7-co-object.mapping";

describe("form 7 CO object deterministic mapping", () => {
  it("contains explicit row mapping for known incident object codes", () => {
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
    expect(mapCoObjectCodeToForm7Rows("14.4")).toEqual({
      deadRowId: "5.1",
      injuredRowId: "15.1",
      fallback: false,
    });
  });

  it("routes unknown code to 'прочие / не классифицировано' and logs", () => {
    const logger = vi.fn();
    const result = mapCoObjectCodeToForm7Rows("99.99", logger);

    expect(result).toEqual(FORM_7_CO_OBJECT_OTHER_ROWS);
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0]?.[0]).toContain("Unrecognized object code");
  });

  it("routes empty code to fallback and logs", () => {
    const logger = vi.fn();
    const result = mapCoObjectCodeToForm7Rows("  ", logger);

    expect(result).toEqual(FORM_7_CO_OBJECT_OTHER_ROWS);
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0]?.[0]).toContain("Empty object code");
  });
});

import { describe, expect, it } from "vitest";
import { validateReportData } from "./report-validation";

describe("validateReportData", () => {
  it("validates form 1 (1-osp) with correct totals", () => {
    const data = {
      "1": { total: 10, urban: 4, rural: 6 },
      "3": { total: 5, urban: 2, rural: 3 },
      "3.1": { total: 2, urban: 1, rural: 1 },
      "3.2": { total: 1, urban: 0, rural: 1 },
      "5": { total: 7, urban: 3, rural: 4 },
      "5.1": { total: 2, urban: 1, rural: 1 },
    };

    expect(validateReportData("1-osp", data)).toEqual([]);
  });

  it("returns expected errors for form 1 (1-osp) totals violations", () => {
    const data = {
      "3": { total: 1, urban: 1, rural: 0 },
      "3.1": { total: 2, urban: 2, rural: 0 },
      "3.2": { total: 3, urban: 1, rural: 2 },
      "5": { total: 1, urban: 1, rural: 0 },
      "5.1": { total: 2, urban: 1, rural: 1 },
    };

    expect(validateReportData("1-osp", data)).toEqual([
      { field: "3.total", message: "Общее число погибших меньше числа погибших детей" },
      { field: "3.total", message: "Общее число погибших меньше числа погибших в нетрезвом виде" },
      { field: "5.total", message: "Общее число травмированных меньше числа травмированных детей" },
    ]);
  });

  it("validates form 5 (5-spzs) with matching breakdowns", () => {
    const data = {
      "2": { urban: 2, rural: 1 },
      "2.1": { urban: 1, rural: 0 },
      "2.2": { urban: 1, rural: 0 },
      "2.3": { urban: 0, rural: 1 },
    };

    expect(validateReportData("5-spzs", data)).toEqual([]);
  });

  it("returns expected errors for form 5 (5-spzs) mismatched totals", () => {
    const data = {
      "2": { urban: 3, rural: 1 },
      "2.1": { urban: 1, rural: 0 },
      "2.2": { urban: 0, rural: 1 },
      "2.3": { urban: 0, rural: 1 },
    };

    expect(validateReportData("5-spzs", data)).toEqual([
      {
        field: "2.total",
        message: "Сумма погибших (мужчин, женщин, детей) не совпадает с общим итогом (стр. 2)",
      },
    ]);
  });

  it("validates form 7 (co) with consistent row 5 totals", () => {
    const data = {
      "5": { killed_total: 3, injured_total: 0 },
      "5.1": { killed_total: 1, injured_total: 0 },
      "5.2": { killed_total: 2, injured_total: 0 },
    };

    expect(validateReportData("co", data)).toEqual([]);
  });

  it("returns expected errors for form 7 (co) row 5 mismatch", () => {
    const data = {
      "5": { killed_total: 2, injured_total: 0 },
      "5.1": { killed_total: 1, injured_total: 0 },
    };

    expect(validateReportData("co", data)).toEqual([
      {
        field: "5.killed_total",
        message: "Строка 5: итог по погибшим должен равняться сумме подпунктов 5.1–5.11 (1), сейчас 2.",
      },
    ]);
  });
});

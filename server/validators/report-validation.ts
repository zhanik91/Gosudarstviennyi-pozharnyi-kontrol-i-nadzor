import {
  FIRE_CAUSES,
  FORM_4_SOVP_ROWS,
  FORM_7_CO_ROWS,
} from "@shared/fire-forms-data";

export function validateReportData(form: string, data: Record<string, any>) {
  const errors: Array<{ field: string; message: string }> = [];
  const isNumber = (value: any) => typeof value === "number" && Number.isFinite(value);
  const getValue = (rowId: string, field: string = "total"): number => {
    return Number(data[rowId]?.[field] || 0);
  };

  const validateRowValues = (rowId: string, fields: string[]) => {
    const row = data[rowId];
    if (!row || typeof row !== "object") {
      return;
    }
    fields.forEach((field) => {
      const value = row[field];
      if (!isNumber(value) || value < 0) {
        errors.push({ field: `${rowId}.${field}`, message: "Укажите неотрицательное число" });
      }
    });
  };

  // Helper to sum multiple row/field values
  const sumRows = (rowIds: string[], field: string = "total"): number => {
    return rowIds.reduce((sum, id) => sum + getValue(id, field), 0);
  };

  const sumChildren = <T extends { id?: string; code?: string; children?: T[] }>(
    node: T,
    field: string,
    getId: (item: T) => string
  ): number => {
    if (!node.children) {
      return 0;
    }
    return node.children.reduce((sum, child) => sum + getValue(getId(child), field), 0);
  };

  const fieldLabel = (field: string) => {
    switch (field) {
      case "fires_total":
        return "количество пожаров";
      case "fires_high_risk":
        return "пожары на объектах высокой степени риска";
      case "damage_total":
        return "ущерб";
      case "damage_high_risk":
        return "ущерб на объектах высокой степени риска";
      case "deaths_total":
        return "погибло людей";
      case "injuries_total":
        return "травмировано людей";
      case "killed_total":
        return "погибло людей";
      case "injured_total":
        return "травмировано людей";
      default:
        return "показатель";
    }
  };

  const validateTreeTotals = <T extends { id?: string; code?: string; children?: T[] }>(
    nodes: T[],
    fields: string[],
    getId: (item: T) => string,
    getLabel: (item: T) => string
  ) => {
    const walk = (node: T) => {
      if (node.children && node.children.length > 0) {
        fields.forEach((field) => {
          const parentId = getId(node);
          const parentValue = getValue(parentId, field);
          const childrenSum = sumChildren(node, field, getId);
          if (parentValue !== childrenSum) {
            errors.push({
              field: `${parentId}.${field}`,
              message: `Строка ${getLabel(node)}: итог "${fieldLabel(field)}" должен равняться сумме подпунктов (${childrenSum}), сейчас ${parentValue}.`,
            });
          }
        });
        node.children.forEach(walk);
      }
    };
    nodes.forEach(walk);
  };

  switch (form) {
    case "1-osp":
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ["total", "urban", "rural"]));

      // Validation Logic: Total Deaths (3) must be >= Children (3.1) and Intoxicated (3.2)
      if (getValue("3") < getValue("3.1")) {
        errors.push({ field: "3.total", message: "Общее число погибших меньше числа погибших детей" });
      }
      if (getValue("3") < getValue("3.2")) {
        errors.push({ field: "3.total", message: "Общее число погибших меньше числа погибших в нетрезвом виде" });
      }
      // Note: Strict equality 3 = 3.1 + 3.2 is NOT enforced because sober adults exist.

      // Injured (5) >= Children (5.1)
      if (getValue("5") < getValue("5.1")) {
        errors.push({ field: "5.total", message: "Общее число травмированных меньше числа травмированных детей" });
      }
      break;

    case "2-ssg":
      Object.entries(data).forEach(([rowId, value]) => {
        if (!isNumber(value) || value < 0) {
          errors.push({ field: rowId, message: "Укажите неотрицательное число" });
        }
      });
      break;

    case "3-spvp":
      Object.keys(data).forEach((rowId) =>
        validateRowValues(rowId, ["fires_total", "fires_high_risk", "damage_total", "damage_high_risk"])
      );
      validateTreeTotals(
        FIRE_CAUSES,
        ["fires_total", "fires_high_risk", "damage_total", "damage_high_risk"],
        (cause) => cause.code ?? "",
        (cause) => cause.code ?? ""
      );
      break;

    case "4-sovp":
      Object.keys(data).forEach((rowId) =>
        validateRowValues(rowId, ["fires_total", "damage_total", "deaths_total", "injuries_total"])
      );
      validateTreeTotals(
        FORM_4_SOVP_ROWS,
        ["fires_total", "damage_total", "deaths_total", "injuries_total"],
        (row) => row.id ?? "",
        (row) => row.number ?? row.id ?? ""
      );
      break;

    case "5-spzs":
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ["urban", "rural"]));
      // Validation: Total Dead (2) should match breakdowns if exhaustive
      // Assuming 2 = 2.1 (Men) + 2.2 (Women) + 2.3 (Children) as implied by compliance notes
      const deadTotal = getValue("2", "urban") + getValue("2", "rural");
      const men = getValue("2.1", "urban") + getValue("2.1", "rural");
      const women = getValue("2.2", "urban") + getValue("2.2", "rural");
      const children = getValue("2.3", "urban") + getValue("2.3", "rural");

      if (deadTotal !== men + women + children) {
        // Only flag if non-zero to avoid noise on empty forms, but strictly if data exists
        if (deadTotal > 0) {
          errors.push({
            field: "2.total",
            message:
              "Сумма погибших (мужчин, женщин, детей) не совпадает с общим итогом (стр. 2)",
          });
        }
      }
      break;

    case "6-sspz":
      Object.keys(data).forEach((rowId) =>
        validateRowValues(rowId, [
          "fires_count",
          "steppe_area",
          "damage_total",
          "people_total",
          "people_dead",
          "people_injured",
          "animals_total",
          "animals_dead",
          "animals_injured",
          "extinguished_total",
          "extinguished_area",
          "extinguished_damage",
          "garrison_people",
          "garrison_units",
          "mchs_people",
          "mchs_units",
        ])
      );
      break;

    case "co": // Form 7-CO
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ["killed_total", "injured_total"]));

      const coTotalRows = FORM_7_CO_ROWS.filter(
        (row) => row.children && row.children.length > 0 && /всего|итого/i.test(row.label)
      );
      validateTreeTotals(
        coTotalRows,
        ["killed_total", "injured_total"],
        (row) => row.id ?? "",
        (row) => row.number ?? row.id ?? ""
      );

      // Row 5: Dead by object (5.1 - 5.11)
      const row5Total = getValue("5", "killed_total");
      const row5Sum = sumRows(
        ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11"],
        "killed_total"
      );
      if (row5Total !== row5Sum) {
        errors.push({
          field: "5.killed_total",
          message: `Строка 5: итог по погибшим должен равняться сумме подпунктов 5.1–5.11 (${row5Sum}), сейчас ${row5Total}.`,
        });
      }

      // Row 6: Dead by place (6.1 - 6.15)
      const row6Total = getValue("6", "killed_total");
      const row6Sum = sumRows(
        [
          "6.1",
          "6.2",
          "6.3",
          "6.4",
          "6.5",
          "6.6",
          "6.7",
          "6.8",
          "6.9",
          "6.10",
          "6.11",
          "6.12",
          "6.13",
          "6.14",
          "6.15",
        ],
        "killed_total"
      );
      if (row6Total !== row6Sum) {
        errors.push({
          field: "6.killed_total",
          message: `Строка 6: итог по погибшим должен равняться сумме подпунктов 6.1–6.15 (${row6Sum}), сейчас ${row6Total}.`,
        });
      }

      // Row 15: Injured by object (15.1 - 15.11)
      const row15Total = getValue("15", "injured_total");
      const row15Sum = sumRows(
        ["15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7", "15.8", "15.9", "15.10", "15.11"],
        "injured_total"
      );
      if (row15Total !== row15Sum) {
        errors.push({
          field: "15.injured_total",
          message: `Строка 15: итог по травмированным должен равняться сумме подпунктов 15.1–15.11 (${row15Sum}), сейчас ${row15Total}.`,
        });
      }

      // Row 16: Injured by place (16.1 - 16.15)
      const row16Total = getValue("16", "injured_total");
      const row16Sum = sumRows(
        [
          "16.1",
          "16.2",
          "16.3",
          "16.4",
          "16.5",
          "16.6",
          "16.7",
          "16.8",
          "16.9",
          "16.10",
          "16.11",
          "16.12",
          "16.13",
          "16.14",
          "16.15",
        ],
        "injured_total"
      );
      if (row16Total !== row16Sum) {
        errors.push({
          field: "16.injured_total",
          message: `Строка 16: итог по травмированным должен равняться сумме подпунктов 16.1–16.15 (${row16Sum}), сейчас ${row16Total}.`,
        });
      }
      break;

    default:
      break;
  }

  return errors;
}

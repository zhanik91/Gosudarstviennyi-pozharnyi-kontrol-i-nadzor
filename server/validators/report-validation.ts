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

  const formatRowLabel = (rowId: string, label?: string) => {
    if (!label) {
      return rowId;
    }
    return `${rowId} (${label})`;
  };

  const validateTreeTotals = <T extends { id?: string; code?: string; children?: T[]; label?: string; name?: string; number?: string }>(
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
              message: `Строка ${getLabel(node)}: итог по "${fieldLabel(field)}" должен равняться сумме подпунктов (${childrenSum}). Сейчас ${parentValue}.`,
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
        (cause) => formatRowLabel(cause.code ?? "", cause.name)
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
        (row) => formatRowLabel(row.number ?? row.id ?? "", row.label)
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

      validateTreeTotals(
        FORM_7_CO_ROWS,
        ["killed_total", "injured_total"],
        (row) => row.id ?? "",
        (row) => formatRowLabel(row.number ?? row.id ?? "", row.label)
      );
      break;

    default:
      break;
  }

  return errors;
}

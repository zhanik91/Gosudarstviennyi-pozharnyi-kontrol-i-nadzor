import { describe, expect, it } from "vitest";
import {
  FORM_5_CONDITION_TO_ROW,
  FORM_5_DEATH_CAUSE_TO_ROW,
  FORM_5_SOCIAL_STATUS_TO_ROW,
  FORM_7_DEAD_CONDITION_TO_ROW,
  FORM_7_DEAD_SOCIAL_STATUS_TO_ROW,
  FORM_7_INJURED_CONDITION_TO_ROW,
  FORM_7_INJURED_SOCIAL_STATUS_TO_ROW,
  mapCoObjectCodeToRowId,
  normalizeIncidentVictimValue,
} from "@shared/constants/incident-victim.constants";

describe("incident victim constants mapping", () => {
  it("normalizes legacy victim values", () => {
    expect(normalizeIncidentVictimValue("socialStatus", "child_preschool")).toBe("child");
    expect(normalizeIncidentVictimValue("socialStatus", "student_uni")).toBe("student");
    expect(normalizeIncidentVictimValue("condition", "unsupervised_child")).toBe("unattended_children");
    expect(normalizeIncidentVictimValue("deathCause", "combustion_products")).toBe("smoke");
    expect(normalizeIncidentVictimValue("deathCause", "psych")).toBe("panic");
  });

  it("keeps unknown values unchanged", () => {
    expect(normalizeIncidentVictimValue("socialStatus", "unknown_value")).toBe("unknown_value");
    expect(normalizeIncidentVictimValue("condition", null)).toBeNull();
  });

  it("maps fire form (form 5) keys to section rows", () => {
    expect(FORM_5_SOCIAL_STATUS_TO_ROW.worker).toBe("2.1.1");
    expect(FORM_5_SOCIAL_STATUS_TO_ROW.student_10_16).toBe("2.1.7.2");
    expect(FORM_5_CONDITION_TO_ROW.unattended_children).toBe("3.1.4");
    expect(FORM_5_DEATH_CAUSE_TO_ROW.smoke).toBe("4.1.2");
  });

  it("maps CO form (form 7) keys to section rows", () => {
    expect(FORM_7_DEAD_SOCIAL_STATUS_TO_ROW.prisoner).toBe("2.10");
    expect(FORM_7_INJURED_SOCIAL_STATUS_TO_ROW.student_7_10).toBe("12.7.1");
    expect(FORM_7_DEAD_CONDITION_TO_ROW.unattended_children).toBe("3.4");
    expect(FORM_7_INJURED_CONDITION_TO_ROW.unattended_children).toBe("13.4");
  });

  it("maps object code values for CO sections", () => {
    expect(mapCoObjectCodeToRowId("14.4")).toBe("5.1");
    expect(mapCoObjectCodeToRowId("14.1.2")).toBe("5.3");
    expect(mapCoObjectCodeToRowId("14.7")).toBe("5.11");
    expect(mapCoObjectCodeToRowId("01")).toBeNull();
  });
});

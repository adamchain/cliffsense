import { describe, expect, it } from "vitest";
import {
  expandEnrolledProgramKeys,
  expandLegacyMedicaidSelection,
  enrolledMatchesProgram,
  isMedicaidFamilyProgram,
} from "./programs";

describe("medicaid program families", () => {
  it("treats legacy Medicaid as every Medicaid subtype for limits", () => {
    expect(expandEnrolledProgramKeys(["Medicaid", "SNAP"]).sort()).toEqual(
      ["MAWD", "MEDICAID", "MEDICAIDABD", "MEDICAIDMAGI", "MEDICAIDWAIVER", "QMB", "SNAP"].sort(),
    );
  });

  it("does not attach ABD limits when only MAGI is enrolled", () => {
    expect(expandEnrolledProgramKeys(["MedicaidMAGI"])).toEqual(["MEDICAIDMAGI"]);
    expect(enrolledMatchesProgram(["MedicaidMAGI"], "MedicaidABD")).toBe(false);
    expect(enrolledMatchesProgram(["MedicaidMAGI"], "Medicaid")).toBe(true);
  });

  it("expands a saved generic Medicaid row into selectable subtypes", () => {
    expect(expandLegacyMedicaidSelection(["Medicaid", "SSI"]).sort()).toEqual(
      ["MAWD", "MedicaidABD", "MedicaidMAGI", "MedicaidWaiver", "QMB", "SSI"].sort(),
    );
  });

  it("drops retired Section 8 enrollments from selectable lists", () => {
    expect(expandEnrolledProgramKeys(["Section8", "SNAP"])).toEqual(["SNAP"]);
    expect(expandLegacyMedicaidSelection(["Section8", "SSI"]).sort()).toEqual(["SSI"]);
  });
});

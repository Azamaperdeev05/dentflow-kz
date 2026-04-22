import { describe, expect, it } from "vitest";
import { getDoctorApprovalStatusLabel } from "../src/lib/kz-labels";

describe("getDoctorApprovalStatusLabel", () => {
  it("returns Kazakh label for PENDING", () => {
    expect(getDoctorApprovalStatusLabel("PENDING")).toBe("⏳ Бекіту күтіліп тұр");
  });

  it("returns Kazakh label for APPROVED", () => {
    expect(getDoctorApprovalStatusLabel("APPROVED")).toBe("✅ Бекітілді");
  });

  it("returns Kazakh label for REJECTED", () => {
    expect(getDoctorApprovalStatusLabel("REJECTED")).toBe("❌ Қабылданбады");
  });

  it("returns approved label for null (patient/admin)", () => {
    expect(getDoctorApprovalStatusLabel(null)).toBe("✅ Бекітілді");
  });

  it("falls back to raw value for unknown status", () => {
    expect(getDoctorApprovalStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

import { describe, expect, it } from "vitest";
import {
  loginOtpVerifySchema,
  registerSchema,
  resetPasswordSchema,
} from "../src/lib/validations";

describe("Auth validation schemas", () => {
  it("accepts valid patient registration payload", () => {
    const parsed = registerSchema.parse({
      name: "Test Patient",
      email: "patient@test.kz",
      phone: "+77001234567",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      role: "PATIENT",
    });

    expect(parsed.role).toBe("PATIENT");
  });

  it("rejects doctor registration without specialization", () => {
    const result = registerSchema.safeParse({
      name: "Dr Test",
      email: "doctor@test.kz",
      phone: "+77001234567",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      role: "DOCTOR",
      specialization: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched reset password confirmation", () => {
    const result = resetPasswordSchema.safeParse({
      email: "patient@test.kz",
      code: "123456",
      password: "StrongPass1!",
      confirmPassword: "StrongPass2!",
    });

    expect(result.success).toBe(false);
  });

  it("accepts only 6-digit OTP code", () => {
    const ok = loginOtpVerifySchema.safeParse({
      email: "patient@test.kz",
      code: "123456",
    });
    const bad = loginOtpVerifySchema.safeParse({
      email: "patient@test.kz",
      code: "12345",
    });

    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

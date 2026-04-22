import { z } from "zod";

const roleSchema = z.enum(["PATIENT", "DOCTOR"]);

export const registerSchema = z
  .object({
    name: z.string().min(2, "Аты-жөні кемінде 2 таңба болуы керек"),
    email: z.string().email("Email форматы қате"),
    phone: z
      .string()
      .regex(/^\+7\d{10}$/, "Телефон форматы +7XXXXXXXXXX болуы керек")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Құпия сөз кемінде 8 таңба болуы керек")
      .regex(/[A-Z]/, "Құпия сөзде кемінде 1 бас әріп болуы керек")
      .regex(/\d/, "Құпия сөзде кемінде 1 сан болуы керек")
      .regex(/[^A-Za-z0-9]/, "Құпия сөзде кемінде 1 ерекше белгі болуы керек"),
    confirmPassword: z.string(),
    role: roleSchema,
    specializations: z.array(z.string()).optional(),
    experience: z.number().int().min(0).optional(),
    licenseNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Құпия сөздер сәйкес келмейді",
      });
    }

    if (data.role === "DOCTOR" && (!data.specializations || data.specializations.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specializations"],
        message: "Дәрігер үшін кемінде бір мамандық таңдау міндетті",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email("Email форматы қате"),
  password: z.string().min(1, "Құпия сөзді енгізіңіз"),
});

export const loginEmailSchema = z.object({
  email: z.string().email("Email форматы қате"),
});

export const loginOtpRequestSchema = z.object({
  email: z.string().email("Email форматы қате"),
  password: z.string().min(1, "Құпия сөзді енгізіңіз"),
});

export const loginOtpVerifySchema = z.object({
  email: z.string().email("Email форматы қате"),
  code: z.string().regex(/^\d{6}$/, "OTP код 6 цифр болуы керек"),
});

export const registerVerifySchema = z.object({
  email: z.string().email("Email форматы қате"),
  code: z.string().regex(/^\d{6}$/, "Код 6 цифр болуы керек"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email форматы қате"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Email форматы қате"),
    code: z.string().regex(/^\d{6}$/, "Код 6 цифр болуы керек"),
    password: z
      .string()
      .min(8, "Құпия сөз кемінде 8 таңба болуы керек")
      .regex(/[A-Z]/, "Құпия сөзде кемінде 1 бас әріп болуы керек")
      .regex(/\d/, "Құпия сөзде кемінде 1 сан болуы керек")
      .regex(/[^A-Za-z0-9]/, "Құпия сөзде кемінде 1 ерекше белгі болуы керек"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Құпия сөздер сәйкес келмейді",
      });
    }
  });

export const twoFactorRecoveryRequestSchema = z.object({
  email: z.string().email("Email форматы қате"),
  password: z.string().min(1, "Құпия сөзді енгізіңіз"),
});

export const twoFactorRecoveryVerifySchema = z.object({
  email: z.string().email("Email форматы қате"),
  code: z.string().regex(/^\d{6}$/, "Код 6 цифр болуы керек"),
});

export type TwoFactorRecoveryRequestInput = z.infer<typeof twoFactorRecoveryRequestSchema>;
export type TwoFactorRecoveryVerifyInput = z.infer<typeof twoFactorRecoveryVerifySchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginEmailInput = z.infer<typeof loginEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type LoginOtpRequestInput = z.infer<typeof loginOtpRequestSchema>;
export type LoginOtpVerifyInput = z.infer<typeof loginOtpVerifySchema>;
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;

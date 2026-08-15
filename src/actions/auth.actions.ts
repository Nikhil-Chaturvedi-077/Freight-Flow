"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import type { ActionResult } from "@/types";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  role: z.enum(["SHIPPER", "TRANSPORTER"]),
  companyName: z.string().min(2, "Company name required").optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
  gstNumber: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ email: string }>> {
  try {
    const validated = RegisterSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { name, email, password, role, companyName, phone, gstNumber } =
      validated.data;

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "An account with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + wallet in transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          companyName,
          phone,
          gstNumber: gstNumber ?? null,
        },
      });

      // Create wallet for all users
      await tx.wallet.create({
        data: { userId: user.id },
      });

      // Create transporter profile if needed
      if (role === "TRANSPORTER") {
        await tx.transporterProfile.create({
          data: { userId: user.id },
        });
      }
    });

    return { success: true, data: { email } };
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function loginUser(
  input: LoginInput
): Promise<ActionResult<void>> {
  try {
    const validated = LoginSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Invalid credentials" };
    }

    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Authentication failed" };
      }
    }
    return { success: false, error: "Something went wrong" };
  }
}
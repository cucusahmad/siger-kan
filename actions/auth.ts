'use server'
import { login } from "@/features/auth/auth.service";
import { AuthenticationError } from "@/features/auth/auth.types";
import { LoginInput, loginRequestSchema } from "@/features/auth/login.schema";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { getRequestContext } from "@/lib/request-context";
import { cookies, headers } from "next/headers";

export async function loginAction(data: LoginInput) {
  try {
    const validation = await loginRequestSchema.parseAsync(data);
    const headersList = await headers();

    const request = new Request(process.env.APP_URL!, {
      headers: headersList,
    });

    const result = await login(validation, getRequestContext(request));
    const cookieStore = await cookies();

    const maxAge = Math.max(
      0,
      Math.floor((result.expiresAt.getTime() - Date.now()) / 1000)
    );

    cookieStore.set(AUTH_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge
    });
    return {
      success: true,
      message: 'Berhasil Login'
    }
  } catch (error) {
    let message = 'Terjadi kesalahan'

    if (error instanceof AuthenticationError) {
      message = error.message
    }
    return {
      success: false,
      message
    }
  }
}
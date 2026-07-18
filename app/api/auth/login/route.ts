import { z } from "zod";

import { AuthenticationError } from "@/features/auth/auth.types";
import { login } from "@/features/auth/auth.service";
import { loginRequestSchema } from "@/features/auth/login.schema";
import { createAuthCookie } from "@/lib/auth-cookie";
import { getRequestContext } from "@/lib/request-context";

const MAX_REQUEST_SIZE_BYTES = 4 * 1024;

function getValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "request");
    errors[field] = [...(errors[field] ?? []), issue.message];
  }

  return errors;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_SIZE_BYTES) {
      return Response.json(
        { success: false, message: "Data login terlalu besar." },
        { status: 413 },
      );
    }

    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json(
      { success: false, message: "Format data login tidak valid." },
      { status: 400 },
    );
  }

  const validation = loginRequestSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      {
        success: false,
        message: "Data login belum valid.",
        errors: getValidationErrors(validation.error),
      },
      { status: 422 },
    );
  }

  try {
    const result = await login(validation.data, getRequestContext(request));
    const response = Response.json({
      success: true,
      message: "Login berhasil.",
      data: { redirectTo: "/dashboard" },
    });
    response.headers.set("Set-Cookie", createAuthCookie(result.accessToken, result.expiresAt));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      return Response.json(
        { success: false, message: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("Unexpected login error", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { success: false, message: "Terjadi kesalahan pada server. Silakan coba kembali." },
      { status: 500 },
    );
  }
}

import { z } from "zod";

import { registrationRequestSchema } from "@/features/auth/registration.schema";
import { registerBusinessActor } from "@/features/auth/registration.service";
import {
  RegistrationConflictError,
  RegistrationReferenceError,
} from "@/features/auth/registration.types";
import { getRequestContext } from "@/lib/request-context";

const MAX_REQUEST_SIZE_BYTES = 16 * 1024;

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

function getValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "request");
    errors[field] = [...(errors[field] ?? []), issue.message];
  }

  return errors;
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE_BYTES) {
    return jsonResponse(
      { success: false, message: "Data pendaftaran terlalu besar." },
      413,
    );
  }

  let requestBody: unknown;

  try {
    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_SIZE_BYTES) {
      return jsonResponse(
        { success: false, message: "Data pendaftaran terlalu besar." },
        413,
      );
    }

    requestBody = JSON.parse(rawBody) as unknown;
  } catch {
    return jsonResponse(
      { success: false, message: "Format data pendaftaran tidak valid." },
      400,
    );
  }

  const validationResult = registrationRequestSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return jsonResponse(
      {
        success: false,
        message: "Data pendaftaran belum valid.",
        errors: getValidationErrors(validationResult.error),
      },
      422,
    );
  }

  try {
    const data = await registerBusinessActor(
      validationResult.data,
      getRequestContext(request),
    );

    return jsonResponse(
      {
        success: true,
        message: "Pendaftaran berhasil. Silakan verifikasi email Anda untuk melanjutkan proses.",
        data,
      },
      201,
    );
  } catch (error: unknown) {
    if (error instanceof RegistrationConflictError) {
      return jsonResponse(
        {
          success: false,
          message: error.message,
          ...(error.field ? { errors: { [error.field]: [error.message] } } : {}),
        },
        409,
      );
    }

    if (error instanceof RegistrationReferenceError) {
      return jsonResponse(
        {
          success: false,
          message: "Data pendaftaran belum valid.",
          errors: { [error.field]: [error.message] },
        },
        422,
      );
    }

    console.error("Unexpected business registration error", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return jsonResponse(
      {
        success: false,
        message: "Terjadi kesalahan pada server. Silakan coba kembali.",
      },
      500,
    );
  }
}

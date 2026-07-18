import type { z } from "zod";

import type { registrationRequestSchema } from "./registration.schema";

export type RegistrationInput = z.infer<typeof registrationRequestSchema>;

export interface RegistrationResult {
  readonly registrationStatus: "PENDING_VERIFICATION";
}

export interface RegistrationRequestContext {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

export class RegistrationConflictError extends Error {
  readonly field: "email" | "phone" | null;

  constructor(message: string, field: "email" | "phone" | null = null) {
    super(message);
    this.name = "RegistrationConflictError";
    this.field = field;
  }
}

export class RegistrationReferenceError extends Error {
  readonly field: "businessType" | "cityRegency" | "commodityId" | "province";

  constructor(
    field: RegistrationReferenceError["field"],
    message: string,
  ) {
    super(message);
    this.name = "RegistrationReferenceError";
    this.field = field;
  }
}

export class RegistrationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationConfigurationError";
  }
}

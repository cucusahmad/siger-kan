export class AuthenticationError extends Error {
  public readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthenticationError";
    this.status = status;
  }
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly fullName: string;
  readonly roles: readonly string[];
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
  readonly businessName: string | null;
  readonly hasBusinessMembership: boolean;
}

export interface LoginResult {
  readonly accessToken: string;
  readonly expiresAt: Date;
}

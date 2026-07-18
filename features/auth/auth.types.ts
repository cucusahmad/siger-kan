export class AuthenticationError extends Error {
  public readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthenticationError";
    this.status = status;
  }
}

export interface AuthenticatedUser {
  readonly fullName: string;
  readonly roles: readonly string[];
  readonly businessName: string | null;
}

export interface LoginResult {
  readonly accessToken: string;
  readonly expiresAt: Date;
}

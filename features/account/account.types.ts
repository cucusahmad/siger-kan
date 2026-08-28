export interface AccountProfile {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly employeeNumber: string | null;
  readonly positionTitle: string | null;
  readonly agencyName: string | null;
  readonly organizationalUnitName: string | null;
  readonly roles: readonly string[];
  readonly businessName: string | null;
  readonly lastLoginAt: Date | null;
  readonly passwordChangedAt: Date | null;
}

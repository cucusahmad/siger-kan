export enum CoachingActivityType {
  QUALITY_CLINIC = "QUALITY_CLINIC",
  ONLINE_CONSULTATION = "ONLINE_CONSULTATION",
}

export interface CoachingActivityRow {
  readonly id: string;
  readonly type: CoachingActivityType;
  readonly title: string;
  readonly businessName: string;
  readonly requesterName: string;
  readonly consultantName: string | null;
  readonly status: string;
  readonly createdAt: string;
  readonly scheduledAt: string | null;
  readonly location: string | null;
  readonly category: string | null;
  readonly description: string;
  readonly consultantNote: string | null;
  readonly responseCount: number;
}

export interface CoachingSummaryData {
  readonly generatedAt: string;
  readonly activities: readonly CoachingActivityRow[];
}

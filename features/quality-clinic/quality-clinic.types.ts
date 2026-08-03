export interface ClinicAppointmentView {
  readonly id: string;
  readonly businessName: string;
  readonly requesterName: string;
  readonly consultantName: string | null;
  readonly topic: string;
  readonly description: string;
  readonly preferredAt: string;
  readonly scheduledAt: string | null;
  readonly location: string | null;
  readonly consultantNote: string | null;
  readonly status: string;
  readonly createdAt: string;
}

export interface ClinicAppointmentPageData {
  readonly isConsultant: boolean;
  readonly appointments: readonly ClinicAppointmentView[];
}

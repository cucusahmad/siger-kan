export interface ConsultationMessageView {
  readonly id: string;
  readonly senderName: string;
  readonly isConsultant: boolean;
  readonly message: string;
  readonly createdAt: string;
  readonly attachments: readonly ConsultationAttachmentView[];
}

export interface ConsultationAttachmentView {
  readonly id: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileSize: string;
  readonly downloadUrl: string;
}

export interface ConsultationView {
  readonly id: string;
  readonly subject: string;
  readonly category: string;
  readonly businessName: string;
  readonly requesterName: string;
  readonly status: string;
  readonly question: string;
  readonly createdAt: string;
  readonly attachments: readonly ConsultationAttachmentView[];
  readonly messages: readonly ConsultationMessageView[];
}

export interface ConsultationPageData {
  readonly isConsultant: boolean;
  readonly consultations: readonly ConsultationView[];
}

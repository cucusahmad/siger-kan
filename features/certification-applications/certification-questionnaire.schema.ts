import { z } from "zod";

const jsonSection = z.record(z.string(), z.unknown()).default({});
const draftText = (maximum?: number) => {
  const schema = z.string().trim();
  return (maximum === undefined ? schema : schema.max(maximum)).default("");
};
const productionFlow = z.object({
  method: z.enum(["DYNAMIC", "UPLOAD"]),
  steps: z.array(z.object({ id: z.string().min(1), activity: draftText(1000), responsiblePerson: draftText(500) })),
  document: z.object({ id: z.string().regex(/^\d+$/), name: draftText(200), originalFileName: draftText(255) }).nullable().default(null),
});
const allowedDocumentMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

function inferDocumentMimeType(fileName: string): (typeof allowedDocumentMimeTypes)[number] | undefined {
  const normalizedName = fileName.toLowerCase();
  if (normalizedName.endsWith(".pdf")) return "application/pdf";
  if (normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg")) return "image/jpeg";
  if (normalizedName.endsWith(".png")) return "image/png";
  return undefined;
}

const fileMetadata = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const file = value as Record<string, unknown>;
  const name = typeof file.name === "string" ? file.name : typeof file.originalFileName === "string" ? file.originalFileName : "";
  const originalFileName = typeof file.originalFileName === "string" ? file.originalFileName : name;
  const legacyMimeType = typeof file.type === "string" ? file.type : undefined;
  const mimeType = typeof file.mimeType === "string" ? file.mimeType : legacyMimeType ?? inferDocumentMimeType(originalFileName || name);

  return {
    ...file,
    name: name || originalFileName,
    originalFileName: originalFileName || name,
    mimeType,
    size: typeof file.size === "number" ? file.size : Number(file.fileSize),
    uploadedAt: typeof file.uploadedAt === "string" ? file.uploadedAt : typeof file.createdAt === "string" ? file.createdAt : new Date(0).toISOString(),
  };
}, z.object({ id: z.string().regex(/^\d+$/), name: z.string().trim().min(1).max(255), originalFileName: z.string().trim().min(1).max(255), mimeType: z.enum(allowedDocumentMimeTypes), size: z.number().int().positive(), uploadedAt: z.string().datetime() }));
const rawMaterial = z.object({ id: z.string().min(1), name: draftText(), origin: draftText(), otherOrigin: draftText(), supplierName: draftText(), supplierAddress: draftText(2000), requirements: draftText(3000), document: fileMetadata.nullable().default(null) });
const additive = z.object({ id: z.string().min(1), name: draftText(), brand: draftText(), supplierName: draftText(), origin: draftText(), otherOrigin: draftText(), function: draftText(), hasPermit: z.enum(["YES", "NO", "NOT_REQUIRED", ""]).default(""), permitNumber: draftText(), halalStatus: z.enum(["CERTIFIED", "NOT_CERTIFIED", "NOT_RELEVANT", ""]).default(""), halalCertificateNumber: draftText(), halalValidUntil: draftText(), halalCertificate: fileMetadata.nullable().default(null), document: fileMetadata.nullable().default(null) });
const qualityDocument = z.object({ id: z.string().min(1), name: draftText(), number: draftText(), revision: draftText(), effectiveDate: draftText(), description: draftText(3000), file: fileMetadata.nullable().default(null) });
const equipment = z.object({ id: z.string().min(1), name: draftText(), specification: draftText(3000), quantity: z.number().int().default(1), requiresCalibration: z.boolean().nullable().default(null), calibrationCertificateNumber: draftText(), calibrationDate: draftText(), calibrationValidUntil: draftText(), calibrationIssuer: draftText(), noCalibrationReason: draftText(2000), ownershipStatus: z.enum(["OWNED", "RENTED", ""]).default(""), ownerName: draftText(), rentalAgreementNumber: draftText(), rentalStartDate: draftText(), rentalEndDate: draftText(), document: fileMetadata.nullable().default(null) });
const productionInformation = z.record(z.string(), z.unknown()).and(z.object({ processFlow: productionFlow.optional(), rawMaterials: z.array(rawMaterial).default([]), additives: z.array(additive).default([]), qualityDocuments: z.array(qualityDocument).default([]), equipment: z.array(equipment).default([]) })).default({ rawMaterials: [], additives: [], qualityDocuments: [], equipment: [] });
const qualityAnswer = z.object({ answer: z.enum(["YES", "NO"]).nullable(), notes: z.string().trim().max(2000).default(""), evidence: z.string().trim().max(500).default("") });
const sniEvaluation = z.object({
  sniKnowledge: z.enum(["YES", "NO", ""]).default(""), readinessStatement: z.string().trim().max(2000).default(""),
  productionCompliance: z.enum(["YES", "NO", ""]).default(""), nonComplianceReason: z.string().trim().max(2000).default(""),
  productTesting: z.enum(["YES", "NO", ""]).default(""), testingDocument: z.object({ id: z.string().regex(/^\d+$/), originalFileName: z.string().trim().max(255) }).nullable().default(null), noTestingReason: z.string().trim().max(2000).default(""),
});
const workforce = z.object({ pendidikan: z.string(), jumlahTetap: z.number().int().min(0), jumlahTidakTetap: z.number().int().min(0), kualifikasi: z.string().trim().max(1000) });
const foreignExpert = z.object({ id: z.string(), kualifikasi: z.string().trim(), kualifikasiLainnya: z.string().trim(), nama: z.string().trim(), negaraAsal: z.string().trim(), keterangan: z.string().trim(), dokumen: z.string().trim() });
const training = z.object({ id: z.string(), namaPelatihan: z.string().trim(), namaPeserta: z.string().trim(), penyelenggara: z.string().trim(), tahun: z.number().int().or(z.literal("")), dokumen: z.string().trim() });
const humanResources = z.object({ tenagaKerja: z.array(workforce).length(6), memilikiTenagaAhliAsing: z.boolean().nullable(), tenagaAhliAsing: z.array(foreignExpert), pernahMengikutiPelatihan: z.boolean().nullable(), alasanTidakPelatihan: z.string().trim().max(2000), pelatihan: z.array(training) });
const certificateDocument = z.object({ id: z.string().regex(/^\d+$/), originalFileName: z.string().trim().max(255) }).nullable();
const managementCertificate = z.object({ number: z.string().trim().max(200), issueDate: z.string().date().or(z.literal("")), validUntil: z.string().date().or(z.literal("")), certificationBody: z.string().trim().max(300), certificationBodyAddress: z.string().trim().max(2000), document: certificateDocument });
const processFlowDocument = z.object({ id: z.string().regex(/^\d+$/), name: z.string().trim().max(200), originalFileName: z.string().trim().max(255) }).nullable();
const certificationsAndProducts = jsonSection.and(z.object({
  managementCertificates: z.object({ "ISO 9001": managementCertificate, HACCP: managementCertificate, "ISO 22000": managementCertificate, Lainnya: managementCertificate }).optional(),
  completeProcessFlow: processFlowDocument.optional(),
  certifiedProducts: z.string().trim().max(5000).default(""),
}));
const marketingChannel = z.object({
  id: z.string().min(1), distributorName: z.string().trim().max(300), address: z.string().trim().max(2000), region: z.enum(["DOMESTIC", "INTERNATIONAL", ""]),
  destinationCountry: z.string().trim().max(160), destinationCity: z.string().trim().max(160), phoneFax: z.string().trim().max(100), contactName: z.string().trim().max(200),
  contactPosition: z.string().trim().max(160), marketingCity: z.string().trim().max(160), percentage: z.number().min(0).max(100), notes: z.string().trim().max(2000),
});

export const certificationQuestionnaireDraftSchema = z.object({
  applicantInformation: jsonSection,
  productInformation: jsonSection,
  productionInformation,
  businessLegality: jsonSection,
  humanResources,
  certificationsAndProducts,
  marketingChannels: z.array(marketingChannel).default([]),
  qualitySystemAnswers: z.array(qualityAnswer).length(27),
  sniEvaluation,
  otherNotes: z.string().trim().max(2000).default(""),
  declarationAccepted: z.boolean().default(false),
  signatoryName: z.string().trim().max(160).default(""),
  signatoryPosition: z.string().trim().max(160).default(""),
  approvalDate: z.string().date().or(z.literal("")).default(""),
  electronicSignatureAccepted: z.boolean().default(false),
});

export const certificationQuestionnaireSubmissionSchema = certificationQuestionnaireDraftSchema.superRefine((value, context) => {
  const requireTextFields = (section: Record<string, unknown>, sectionName: string, fields: readonly string[]) => fields.forEach((field) => { if (typeof section[field] !== "string" || !section[field].trim()) context.addIssue({ code: "custom", path: [sectionName, field], message: "Field ini wajib diisi." }); });
  requireTextFields(value.applicantInformation, "applicantInformation", ["upiName", "officeAddress", "phone", "email", "nib", "yearEstablished", "operationalYear", "contactPerson"]);
  requireTextFields(value.productInformation, "productInformation", ["brand", "productType", "netWeight", "netWeightUnit", "shelfLife", "productionDateFormat", "expiryDateFormat", "sni", "labelInformation", "packagingType", "productionCapacity", "averageProduction", "iceRequirementAmount", "iceRequirementUnit", "iceOrigin"]);
  const productPhotos = value.productInformation.productPhotos as Record<string, unknown> | undefined;
  if (!productPhotos?.front || !productPhotos.back || !productPhotos.side) context.addIssue({ code: "custom", path: ["productInformation", "productPhotos"], message: "Foto kemasan depan, belakang, dan samping wajib diunggah." });
  requireTextFields(value.productionInformation, "productionInformation", ["sameProductionLocation", "facility", "organizationStructure", "responsiblePerson"]);
  const legality = value.businessLegality;
  const validateLegalDocument = (key: string, label: string, issueDateOptional = false) => {
    const document = legality[key] as Record<string, unknown> | undefined;
    if (!document || !document.availability) { context.addIssue({ code: "custom", path: ["businessLegality", key], message: `Status ${label} wajib dipilih.` }); return; }
    if (document.availability === "MISSING" && (typeof document.reason !== "string" || !document.reason.trim())) context.addIssue({ code: "custom", path: ["businessLegality", key, "reason"], message: `Alasan ${label} tidak tersedia wajib diisi.` });
    if (document.availability !== "AVAILABLE") return;
    if (typeof document.number !== "string" || !document.number.trim()) context.addIssue({ code: "custom", path: ["businessLegality", key, "number"], message: `Nomor ${label} wajib diisi.` });
    if (typeof document.issuer !== "string" || !document.issuer.trim()) context.addIssue({ code: "custom", path: ["businessLegality", key, "issuer"], message: `Penerbit ${label} wajib diisi.` });
    if (!issueDateOptional && (typeof document.issueDate !== "string" || !document.issueDate)) context.addIssue({ code: "custom", path: ["businessLegality", key, "issueDate"], message: `Tanggal terbit ${label} wajib diisi.` });
    if (typeof document.issueDate === "string" && document.issueDate > new Date().toISOString().slice(0, 10)) context.addIssue({ code: "custom", path: ["businessLegality", key, "issueDate"], message: "Tanggal diterbitkan tidak boleh melebihi tanggal hari ini." });
    if (document.validityMode === "DATE" && (typeof document.validUntil !== "string" || !document.validUntil || (typeof document.issueDate === "string" && document.validUntil < document.issueDate))) context.addIssue({ code: "custom", path: ["businessLegality", key, "validUntil"], message: "Tanggal berakhir tidak boleh lebih awal dari tanggal diterbitkan." });
    const file = document.file as Record<string, unknown> | undefined;
    if (!file || typeof file.id !== "string" || !/^\d+$/.test(file.id)) context.addIssue({ code: "custom", path: ["businessLegality", key, "file"], message: `Unggah berkas ${label}.` });
  };
  validateLegalDocument("investment", "Status PMA/PMDN"); validateLegalDocument("establishment", "Akta Pendirian"); validateLegalDocument("industrialLicense", "Surat Izin Usaha Tetap Industri"); validateLegalDocument("npwp", "NPWP", true);
  if (legality.profileConfirmed !== true) context.addIssue({ code: "custom", path: ["businessLegality", "profileConfirmed"], message: "Konfirmasi pembaruan Profil UPI wajib disetujui." });
  if (legality.amendmentAvailability === "AVAILABLE" && legality.hasAmendments === "YES") { const amendments = Array.isArray(legality.amendments) ? legality.amendments as Record<string, unknown>[] : []; if (!amendments.length) context.addIssue({ code: "custom", path: ["businessLegality", "amendments"], message: "Tambahkan minimal satu Akta Perubahan." }); amendments.forEach((document, index) => { if (!document.number || !document.issuer || !document.issueDate || !document.issuePlace || !Array.isArray(document.changeTypes) || !document.changeTypes.length || !(document.file as Record<string, unknown> | undefined)?.id) context.addIssue({ code: "custom", path: ["businessLegality", "amendments", index], message: "Data wajib Akta Perubahan belum lengkap." }); }); }
  const flow = value.productionInformation.processFlow;
  if (flow?.method === "DYNAMIC" && (flow.steps.length === 0 || flow.steps.some((step) => !step.activity || !step.responsiblePerson))) context.addIssue({ code: "custom", path: ["productionInformation", "processFlow"], message: "Lengkapi kegiatan dan penanggung jawab pada seluruh alur proses." });
  if (flow?.method === "UPLOAD" && !flow.document) context.addIssue({ code: "custom", path: ["productionInformation", "processFlow", "document"], message: "Unggah file flowchart proses produksi." });
  if (value.productionInformation.rawMaterials.length === 0) context.addIssue({ code: "custom", path: ["productionInformation", "rawMaterials"], message: "Minimal satu bahan baku harus ditambahkan." });
  value.productionInformation.rawMaterials.forEach((row, index) => { if (!row.name || !row.origin || !row.requirements) context.addIssue({ code: "custom", path: ["productionInformation", "rawMaterials", index], message: "Nama, asal, dan persyaratan bahan baku wajib diisi." }); if (row.origin === "Lainnya" && !row.otherOrigin) context.addIssue({ code: "custom", path: ["productionInformation", "rawMaterials", index, "otherOrigin"], message: "Asal bahan baku lainnya wajib diisi." }); if (row.origin && row.origin !== "Produksi sendiri" && !row.supplierName) context.addIssue({ code: "custom", path: ["productionInformation", "rawMaterials", index, "supplierName"], message: "Nama pemasok wajib diisi karena bahan baku berasal dari pihak luar." }); });
  value.productionInformation.additives.forEach((row, index) => { if (!row.name || !row.supplierName || !row.origin || !row.function || !row.hasPermit || !row.halalStatus) context.addIssue({ code: "custom", path: ["productionInformation", "additives", index], message: "Data wajib bahan tambahan belum lengkap." }); if (row.hasPermit === "YES" && !row.permitNumber) context.addIssue({ code: "custom", path: ["productionInformation", "additives", index, "permitNumber"], message: "Nomor izin edar wajib diisi." }); if (row.halalStatus === "CERTIFIED" && (!row.halalCertificateNumber || !row.halalValidUntil || !row.halalCertificate)) context.addIssue({ code: "custom", path: ["productionInformation", "additives", index, "halalCertificate"], message: "Nomor, masa berlaku, dan berkas sertifikat halal wajib dilengkapi." }); });
  value.productionInformation.qualityDocuments.forEach((row, index) => { if (!row.name || !row.number || !row.revision || !row.effectiveDate || !row.file) context.addIssue({ code: "custom", path: ["productionInformation", "qualityDocuments", index], message: "Nama, nomor, revisi, tanggal berlaku, dan berkas dokumen mutu wajib dilengkapi." }); });
  if (value.productionInformation.equipment.length === 0) context.addIssue({ code: "custom", path: ["productionInformation", "equipment"], message: "Minimal satu peralatan produksi harus ditambahkan." });
  value.productionInformation.equipment.forEach((row, index) => { if (!row.name || !row.specification || row.quantity < 1 || row.requiresCalibration === null || !row.ownershipStatus) context.addIssue({ code: "custom", path: ["productionInformation", "equipment", index], message: "Data wajib peralatan produksi belum lengkap." }); if (row.requiresCalibration && (!row.calibrationCertificateNumber || !row.calibrationDate || !row.calibrationValidUntil || !row.calibrationIssuer || !row.document)) context.addIssue({ code: "custom", path: ["productionInformation", "equipment", index, "calibrationCertificateNumber"], message: "Data dan sertifikat kalibrasi/tera wajib dilengkapi." }); if (row.requiresCalibration === false && !row.noCalibrationReason) context.addIssue({ code: "custom", path: ["productionInformation", "equipment", index, "noCalibrationReason"], message: "Alasan tidak memerlukan kalibrasi/tera wajib diisi." }); if (row.ownershipStatus === "RENTED" && (!row.ownerName || !row.rentalAgreementNumber || !row.rentalStartDate || !row.rentalEndDate || !row.document)) context.addIssue({ code: "custom", path: ["productionInformation", "equipment", index, "rentalAgreementNumber"], message: "Data perjanjian dan dokumen sewa wajib dilengkapi." }); });
  if (!value.certificationsAndProducts.completeProcessFlow) context.addIssue({ code: "custom", path: ["certificationsAndProducts", "completeProcessFlow"], message: "Unggah alur lengkap produksi/pengolahan dan diagram." });
  if (typeof value.certificationsAndProducts.certifiedProducts !== "string" || !value.certificationsAndProducts.certifiedProducts.trim()) context.addIssue({ code: "custom", path: ["certificationsAndProducts", "certifiedProducts"], message: "Produk yang akan atau telah disertifikasi wajib diisi." });
  value.humanResources.tenagaKerja.forEach((row, index) => { if ((row.jumlahTetap > 0 || row.jumlahTidakTetap > 0) && !row.kualifikasi) context.addIssue({ code: "custom", path: ["humanResources", "tenagaKerja", index, "kualifikasi"], message: "Kualifikasi wajib diisi karena terdapat tenaga kerja." }); });
  if (value.humanResources.memilikiTenagaAhliAsing === null) context.addIssue({ code: "custom", path: ["humanResources", "memilikiTenagaAhliAsing"], message: "Pilih apakah UPI memiliki tenaga ahli asing." });
  if (value.humanResources.memilikiTenagaAhliAsing && value.humanResources.tenagaAhliAsing.length === 0) context.addIssue({ code: "custom", path: ["humanResources", "tenagaAhliAsing"], message: "Tambahkan minimal satu tenaga ahli asing." });
  value.humanResources.tenagaAhliAsing.forEach((row, index) => { if (!row.kualifikasi || !row.nama || !row.negaraAsal || !row.keterangan || (row.kualifikasi === "Lainnya" && !row.kualifikasiLainnya)) context.addIssue({ code: "custom", path: ["humanResources", "tenagaAhliAsing", index], message: "Data tenaga ahli asing wajib dilengkapi." }); });
  if (value.humanResources.pernahMengikutiPelatihan === null) context.addIssue({ code: "custom", path: ["humanResources", "pernahMengikutiPelatihan"], message: "Pilih apakah personel UPI pernah mengikuti pelatihan." });
  if (value.humanResources.pernahMengikutiPelatihan && value.humanResources.pelatihan.length === 0) context.addIssue({ code: "custom", path: ["humanResources", "pelatihan"], message: "Tambahkan minimal satu data pelatihan." });
  value.humanResources.pelatihan.forEach((row, index) => { if (!row.namaPelatihan || !row.namaPeserta || !row.penyelenggara || !row.tahun || row.tahun > new Date().getFullYear()) context.addIssue({ code: "custom", path: ["humanResources", "pelatihan", index], message: "Data pelatihan wajib lengkap dan tahun tidak boleh melebihi tahun berjalan." }); });
  if (value.qualitySystemAnswers.some((item) => item.answer === null)) context.addIssue({ code: "custom", path: ["qualitySystemAnswers"], message: "Seluruh pertanyaan sistem mutu wajib dijawab" });
  const sni = value.sniEvaluation;
  if (!sni.sniKnowledge) context.addIssue({ code: "custom", path: ["sniEvaluation", "sniKnowledge"], message: "Status pengetahuan SNI wajib dipilih." });
  if (sni.sniKnowledge === "NO" && !sni.readinessStatement) context.addIssue({ code: "custom", path: ["sniEvaluation", "readinessStatement"], message: "Pernyataan kesiapan memahami SNI wajib diisi." });
  if (!sni.productionCompliance) context.addIssue({ code: "custom", path: ["sniEvaluation", "productionCompliance"], message: "Status penerapan proses produksi sesuai SNI wajib dipilih." });
  if (sni.productionCompliance === "NO" && !sni.nonComplianceReason) context.addIssue({ code: "custom", path: ["sniEvaluation", "nonComplianceReason"], message: "Alasan proses produksi belum sesuai SNI wajib diisi." });
  if (!sni.productTesting) context.addIssue({ code: "custom", path: ["sniEvaluation", "productTesting"], message: "Status pengujian mutu produk wajib dipilih." });
  if (sni.productTesting === "YES" && !sni.testingDocument) context.addIssue({ code: "custom", path: ["sniEvaluation", "testingDocument"], message: "Hasil pengujian mutu produk wajib dilampirkan." });
  if (sni.productTesting === "NO" && !sni.noTestingReason) context.addIssue({ code: "custom", path: ["sniEvaluation", "noTestingReason"], message: "Alasan belum adanya pengujian mutu wajib diisi." });
  if (!value.declarationAccepted) context.addIssue({ code: "custom", path: ["declarationAccepted"], message: "Pernyataan pemohon wajib disetujui" });
  if (!value.electronicSignatureAccepted || !value.signatoryName || !value.signatoryPosition || !value.approvalDate) context.addIssue({ code: "custom", path: ["signatoryName"], message: "Pengesahan wajib dilengkapi" });
  if (!value.marketingChannels.length) context.addIssue({ code: "custom", path: ["marketingChannels"], message: "Minimal satu jalur pemasaran harus ditambahkan." });
  value.marketingChannels.forEach((row, index) => { if (!row.distributorName || !row.address || !row.region || !row.contactName || !row.marketingCity || (row.region === "INTERNATIONAL" && (!row.destinationCountry || !row.destinationCity))) context.addIssue({ code: "custom", path: ["marketingChannels", index], message: "Data wajib jalur pemasaran belum lengkap." }); });
  const percentage = value.marketingChannels.reduce((total, row) => total + row.percentage, 0);
  if (percentage !== 100) context.addIssue({ code: "custom", path: ["marketingChannels"], message: "Total persentase pemasaran harus tepat 100%." });
});

export type CertificationQuestionnaireInput = z.infer<typeof certificationQuestionnaireDraftSchema>;

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, ImageIcon, LoaderCircle, Save, Send, Upload } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { defaultHumanResources, HumanResourcesForm, type HumanResourcesData } from "./HumanResourcesForm";
import { defaultProductionFlow, ProductionFlowForm, type ProductionFlowData } from "./ProductionFlowForm";
import { defaultProductionMaterials, ProductionMaterialsForm, type ProductionMaterialsData, type ProductionMaterialsErrors } from "./ProductionMaterialsForm";
import { defaultManagementCertificates, ManagementCertificatesTable, type ManagementCertificates } from "./ManagementCertificatesTable";
import { ProcessFlowDocumentUpload, type ProcessFlowDocument } from "./ProcessFlowDocumentUpload";
import { BusinessLegalityForm, defaultBusinessLegality, normalizeBusinessLegality, validateBusinessLegality, type BusinessLegalityData, type BusinessLegalityErrors } from "./BusinessLegalityForm";
import { MarketingChannelsForm, validateMarketingChannels, type MarketingChannel, type MarketingChannelsErrors } from "./MarketingChannelsForm";
import { defaultSniEvaluation, SniEvaluationForm, type SniEvaluationData } from "./SniEvaluationForm";

interface QualityAnswer { answer: "YES" | "NO" | null; notes: string; evidence: string }
interface Row { [key: string]: string }
interface CertificationsAndProducts { managementCertificates?: ManagementCertificates; completeProcessFlow?: ProcessFlowDocument | null; certifiedProducts?: string }
interface PackagingPhoto { id: string; name: string; originalFileName: string; mimeType: string; fileSize: string }
interface PackagingPhotos { front?: PackagingPhoto; back?: PackagingPhoto; side?: PackagingPhoto }
interface ProductInformation { [key: string]: string | PackagingPhotos | undefined; productPhotos?: PackagingPhotos }
interface ProductionInformation {
  sameProductionLocation?: string; facility?: string; organizationStructure?: string; responsiblePerson?: string;
  rawMaterials: ProductionMaterialsData["rawMaterials"]; additives: ProductionMaterialsData["additives"]; qualityDocuments: ProductionMaterialsData["qualityDocuments"]; equipment: ProductionMaterialsData["equipment"];
  processFlow: ProductionFlowData;
}
interface QuestionnaireValues {
  applicantInformation: Row; productInformation: ProductInformation; productionInformation: ProductionInformation; businessLegality: BusinessLegalityData;
  humanResources: HumanResourcesData; certificationsAndProducts: CertificationsAndProducts; marketingChannels: MarketingChannel[];
  qualitySystemAnswers: QualityAnswer[]; sniEvaluation: SniEvaluationData; otherNotes: string;
  declarationAccepted: boolean; signatoryName: string; signatoryPosition: string; approvalDate: string; electronicSignatureAccepted: boolean;
}
interface Props { readonly applicationId: string; readonly onBack: () => void; readonly onSubmitted: (message: string) => Promise<void> }

interface QuestionnaireResponse { readonly success?: boolean; readonly message?: string; readonly errors?: unknown }

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";
const netWeightUnits = ["kg", "g", "mg", "ton", "liter", "ml", "pcs", "kemasan", "lainnya"] as const;
const iceRequirementUnits = ["kg/hari", "balok/hari"] as const;
const steps = ["Informasi Pemohon", "Informasi Produk", "Proses Produksi", "Legalitas UPI", "Sumber Daya Manusia", "Sertifikasi dan Produk", "Jalur Pemasaran", "Kuesioner Sistem Mutu", "Evaluasi Penerapan SNI", "Pernyataan dan Pengesahan"] as const;
export const qualitySystemQuestions = [
  "Apakah UPI memiliki panduan mutu atau dokumen sejenis?", "Apakah panduan mutu tersebut ditinjau secara berkala?", "Apakah terdapat aturan untuk mengontrol proses produksi?", "Apakah tersedia dokumen kontrol dan lembar pemeriksaan proses produksi?", "Apakah terdapat metode penyimpanan, revisi, persetujuan, identifikasi, dan distribusi dokumen?", "Apakah dokumen dipelihara?", "Apakah UPI memiliki kebijakan mutu?", "Apakah tersedia struktur organisasi dan uraian tugas yang jelas?", "Apakah terdapat petugas yang bertanggung jawab atas Quality Assurance?", "Apakah pernah dilakukan sosialisasi pencapaian kualitas melalui quality meeting?", "Apakah ada pertemuan untuk membahas peningkatan sistem mutu?", "Apakah tersedia pelatihan aspek mutu yang diterapkan secara sistematis?", "Apakah rekaman atau arsip pelatihan disimpan?", "Apakah operator diklasifikasikan berdasarkan keterampilan?", "Apakah tersedia buku riwayat pemeliharaan peralatan?", "Apakah terdapat aturan peninjauan atau persetujuan model baru?", "Apakah terdapat prosedur pemenuhan permintaan spesifikasi dan penanggung jawabnya?", "Apakah tersedia tenaga ahli pengembangan produk yang berpengalaman dan bersertifikat?", "Apakah peralatan, metode kerja, kondisi proses, dan alat ukur ditentukan secara jelas?", "Apakah produk pertama dan produk terakhir diperiksa dan dicatat?", "Apakah produk dikendalikan agar mudah ditelusuri?", "Apakah penanganan, penyimpanan, pengemasan, dan pengiriman dilakukan sesuai persyaratan?", "Apakah semua alat ukur dikontrol melalui buku kendali?", "Apakah UPI melaksanakan audit mutu internal?", "Apakah tindakan perbaikan dilakukan atas temuan audit internal?", "Apakah produk cacat dipisahkan dari produk yang baik?", "Apakah terdapat metode tindakan perbaikan dan tindakan pencegahan?",
] as const;
const questions = qualitySystemQuestions;

const defaultValues: QuestionnaireValues = {
  applicantInformation: {}, productInformation: {}, productionInformation: { processFlow: defaultProductionFlow, ...defaultProductionMaterials }, businessLegality: defaultBusinessLegality, humanResources: defaultHumanResources, certificationsAndProducts: {}, marketingChannels: [],
  qualitySystemAnswers: qualitySystemQuestions.map(() => ({ answer: null, notes: "", evidence: "" })), sniEvaluation: defaultSniEvaluation, otherNotes: "", declarationAccepted: false, signatoryName: "", signatoryPosition: "", approvalDate: "", electronicSignatureAccepted: false,
};

function normalizeQuestionnaireValues(value?: Partial<QuestionnaireValues>): QuestionnaireValues {
  const production = value?.productionInformation;
  const savedFlow = production?.processFlow;
  const processFlow = savedFlow && (savedFlow.method === "DYNAMIC" || savedFlow.method === "UPLOAD") && Array.isArray(savedFlow.steps)
    ? savedFlow
    : defaultProductionFlow;
  const savedHumanResources = value?.humanResources;
  const humanResources: HumanResourcesData = savedHumanResources && Array.isArray(savedHumanResources.tenagaKerja) && savedHumanResources.tenagaKerja.length === defaultHumanResources.tenagaKerja.length
    ? { ...defaultHumanResources, ...savedHumanResources, tenagaAhliAsing: Array.isArray(savedHumanResources.tenagaAhliAsing) ? savedHumanResources.tenagaAhliAsing : [], pelatihan: Array.isArray(savedHumanResources.pelatihan) ? savedHumanResources.pelatihan : [] }
    : defaultHumanResources;
  const savedCertificates = value?.certificationsAndProducts?.managementCertificates;
  const managementCertificates = Object.fromEntries(Object.entries(defaultManagementCertificates).map(([name, certificate]) => [name, { ...certificate, ...(savedCertificates?.[name as keyof ManagementCertificates] ?? {}) }])) as ManagementCertificates;
  const savedAnswers = Array.isArray(value?.qualitySystemAnswers) ? value.qualitySystemAnswers : [];
  const qualitySystemAnswers = qualitySystemQuestions.map((_, index) => ({ ...defaultValues.qualitySystemAnswers[index], ...savedAnswers[index] }));
  return {
    ...defaultValues,
    ...value,
    applicantInformation: { ...defaultValues.applicantInformation, ...(value?.applicantInformation ?? {}) },
    productInformation: { ...defaultValues.productInformation, ...(value?.productInformation ?? {}) },
    productionInformation: { ...defaultProductionMaterials, ...(production ?? {}), processFlow },
    businessLegality: normalizeBusinessLegality(value?.businessLegality),
    humanResources,
    certificationsAndProducts: { ...(value?.certificationsAndProducts ?? {}), managementCertificates },
    marketingChannels: Array.isArray(value?.marketingChannels) ? value.marketingChannels : [],
    qualitySystemAnswers,
    sniEvaluation: { ...defaultSniEvaluation, ...(value?.sniEvaluation ?? {}) },
  };
}

export function CertificationQuestionnaireWizard({ applicationId, onBack, onSubmitted }: Props) {
  const [step, setStep] = useState(0); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [humanResourcesErrors, setHumanResourcesErrors] = useState<Record<string, string>>({});
  const [productionMaterialsErrors, setProductionMaterialsErrors] = useState<ProductionMaterialsErrors>({});
  const [businessLegalityErrors, setBusinessLegalityErrors] = useState<BusinessLegalityErrors>({});
  const [marketingChannelsErrors, setMarketingChannelsErrors] = useState<MarketingChannelsErrors>({});
  const [validatedSteps, setValidatedSteps] = useState<ReadonlySet<number>>(new Set());
  const { register, reset, getValues, setValue, control } = useForm<QuestionnaireValues>({ defaultValues });
  const watchedValues = useWatch({ control });
  const questionnaireValues = normalizeQuestionnaireValues(watchedValues as unknown as Partial<QuestionnaireValues>);
  const humanResources = useWatch({ control, name: "humanResources" });
  const productPhotos = useWatch({ control, name: "productInformation.productPhotos" }) as PackagingPhotos | undefined;
  const productionFlow = useWatch({ control, name: "productionInformation.processFlow" }) ?? defaultProductionFlow;
  const productionMaterials: ProductionMaterialsData = { rawMaterials: useWatch({ control, name: "productionInformation.rawMaterials" }) ?? [], additives: useWatch({ control, name: "productionInformation.additives" }) ?? [], qualityDocuments: useWatch({ control, name: "productionInformation.qualityDocuments" }) ?? [], equipment: useWatch({ control, name: "productionInformation.equipment" }) ?? [] };
  const managementCertificates = useWatch({ control, name: "certificationsAndProducts.managementCertificates" });
  const completeProcessFlow = useWatch({ control, name: "certificationsAndProducts.completeProcessFlow" }) ?? null;
  const businessLegality = useWatch({ control, name: "businessLegality" }) ?? defaultBusinessLegality;
  const marketingChannels = useWatch({ control, name: "marketingChannels" }) ?? [];
  const sniEvaluation = useWatch({ control, name: "sniEvaluation" }) ?? defaultSniEvaluation;
  useEffect(() => {
    let active = true;
    async function loadQuestionnaire() {
      setLoading(true); setNotice("");
      try {
        const response = await fetch(`/api/certification-applications/${applicationId}/questionnaire`);
        const result = await response.json() as { success?: boolean; message?: string; data?: Partial<QuestionnaireValues> };
        if (!active) return;
        if (!response.ok || !result.success || !result.data) { setNotice(result.message ?? "Kuesioner tidak dapat dimuat."); return; }
        reset(normalizeQuestionnaireValues(result.data));
      } catch {
        if (active) setNotice("Kuesioner tidak dapat dimuat. Periksa koneksi lalu coba kembali.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadQuestionnaire();
    return () => { active = false; };
  }, [applicationId, reset]);
  async function save(submit = false) { setBusy(true); setNotice(""); try { const response = await fetch(`/api/certification-applications/${applicationId}/questionnaire`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ submit, data: getValues() }) }); const result = await response.json() as QuestionnaireResponse; const details = collectValidationMessages(result.errors); const message = details.length ? `${result.message ?? "Data belum lengkap"} ${details.join("; ")}` : result.message ?? "Data kuesioner gagal disimpan."; setNotice(message); if (result.success && submit) await onSubmitted(message); return result.success === true; } catch { setNotice("Data kuesioner gagal disimpan. Periksa koneksi lalu coba kembali."); return false; } finally { setBusy(false); } }
  function validateStep(currentStep: number) {
    const values = getValues();
    const productionErrors = currentStep === 2 ? validateProductionMaterials(values.productionInformation) : {};
    const legalityErrors = currentStep === 3 ? validateBusinessLegality(values.businessLegality) : {};
    const workforceErrors = currentStep === 4 ? validateHumanResources(values.humanResources) : {};
    const channelErrors = currentStep === 6 ? validateMarketingChannels(values.marketingChannels) : {};
    if (currentStep === 2) setProductionMaterialsErrors(productionErrors);
    if (currentStep === 3) setBusinessLegalityErrors(legalityErrors);
    if (currentStep === 4) setHumanResourcesErrors(workforceErrors);
    if (currentStep === 6) setMarketingChannelsErrors(channelErrors);
    const issues = getStepIssues(currentStep, values, { productionErrors, legalityErrors, workforceErrors, channelErrors });
    setValidatedSteps((previous) => new Set(previous).add(currentStep));
    if (issues.length) setNotice(`Data wajib belum lengkap: ${issues.join("; ")}`);
    return issues;
  }
  async function saveAndContinue() { if (validateStep(step).length) return; if (await save()) { setNotice(`${steps[step]} berhasil disimpan.`); setValidatedSteps((previous) => new Set(previous).add(step)); setStep((value) => Math.min(value + 1, steps.length - 1)); } }
  async function submitQuestionnaire() { const incompleteStep = steps.findIndex((_, index) => getStepIssues(index, getValues()).length > 0); setValidatedSteps(new Set(steps.map((_, index) => index))); if (incompleteStep >= 0) { setStep(incompleteStep); const issues = getStepIssues(incompleteStep, getValues()); setNotice(`Kuesioner belum dapat dikirim. ${steps[incompleteStep]} belum lengkap: ${issues.join("; ")}`); return; } await save(true); }
  const currentStepIssues = getStepIssues(step, questionnaireValues);
  if (loading) return <div className="flex min-h-64 items-center justify-center rounded-2xl border bg-white"><LoaderCircle className="animate-spin text-[#087E8B]" aria-label="Memuat kuesioner"/></div>;
  return <div className="space-y-6">
    <div className="flex items-center gap-4"><button type="button" onClick={onBack} aria-label="Kembali" className="rounded-xl border bg-white p-2.5"><ArrowLeft size={19}/></button><div><h1 className="text-2xl font-bold text-[#073B4C]">DK 7.3 — Kuesioner Lampiran Aplikasi</h1><p className="mt-1 text-sm text-slate-500">Lengkapi data secara benar. Informasi dapat diaudit dan diverifikasi oleh LSPro-HP.</p></div></div>
    <nav aria-label="Tahapan kuesioner" className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#087E8B]">Langkah {step + 1} dari {steps.length}</p><p className="mt-1 font-bold text-[#073B4C]">{steps[step]}</p></div><span className="text-sm font-semibold text-slate-500">{Math.round(((step + 1) / steps.length) * 100)}%</span></div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0FA3B1] transition-[width]" style={{ width: `${((step + 1) / steps.length) * 100}%` }}/></div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{steps.map((label, index) => { const complete = getStepIssues(index, questionnaireValues).length === 0; return <li key={label}><button type="button" aria-current={step === index ? "step" : undefined} onClick={() => { setStep(index); setNotice(""); }} className={`h-full w-full rounded-xl border p-3 text-left text-xs font-semibold transition ${step === index ? "border-[#087E8B] bg-cyan-50 text-[#073B4C] ring-2 ring-[#0FA3B1]/10" : "border-slate-200 bg-white text-slate-500 hover:border-[#61C0BF]"}`}><span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${complete ? "bg-[#2E9F6B]" : step === index ? "bg-[#087E8B]" : "bg-[#073B4C]"}`}>{index + 1}</span>{label}<span className={`mt-2 flex items-center gap-1 text-[11px] ${complete ? "text-emerald-700" : "text-amber-700"}`}>{complete ? <CheckCircle2 size={13}/> : <CircleAlert size={13}/>} {complete ? "Lengkap" : "Belum lengkap"}</span></button></li>; })}</ol>
    </nav>
    {step === 6 && <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold text-[#073B4C]">Langkah 7 — Jalur Pemasaran</h2><div className="mt-5"><MarketingChannelsForm value={marketingChannels} errors={marketingChannelsErrors} onChange={(value) => { setValue("marketingChannels", value, { shouldDirty: true }); setMarketingChannelsErrors({}); setNotice(""); }}/></div></section>}
    {step === 8 && <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold text-[#073B4C]">Langkah 9 — Evaluasi Penerapan SNI</h2><div className="mt-5"><SniEvaluationForm applicationId={applicationId} value={{ ...defaultSniEvaluation, ...sniEvaluation }} disabled={busy} onChange={(value) => setValue("sniEvaluation", value, { shouldDirty: true })} onNotice={setNotice}/></div></section>}
    {step !== 6 && step !== 8 && <>
    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold text-[#073B4C]">Langkah {step + 1} — {steps[step]}</h2><div className="mt-5">{step === 1 ? <ProductInformationForm applicationId={applicationId} register={register} photos={productPhotos ?? {}} busy={busy} onPhotosChange={(value) => setValue("productInformation.productPhotos", value, { shouldDirty: true })} onNotice={setNotice}/> : step === 3 ? <BusinessLegalityForm applicationId={applicationId} value={businessLegality} errors={businessLegalityErrors} onChange={(value) => { setValue("businessLegality", value, { shouldDirty: true }); setBusinessLegalityErrors({}); }} onNotice={setNotice}/> : step === 4 ? <HumanResourcesForm value={humanResources} errors={humanResourcesErrors} onChange={(value) => { setValue("humanResources", value, { shouldDirty: true }); setHumanResourcesErrors({}); }}/> : step === 2 ? <ProductionInformationForm applicationId={applicationId} register={register} flow={productionFlow} materials={productionMaterials} errors={productionMaterialsErrors} busy={busy} onFlowChange={(value) => setValue("productionInformation.processFlow", value, { shouldDirty: true })} onMaterialsChange={(value) => { setValue("productionInformation.rawMaterials", value.rawMaterials, { shouldDirty: true }); setValue("productionInformation.additives", value.additives, { shouldDirty: true }); setValue("productionInformation.qualityDocuments", value.qualityDocuments, { shouldDirty: true }); setValue("productionInformation.equipment", value.equipment, { shouldDirty: true }); setProductionMaterialsErrors({}); }} onNotice={setNotice}/> : step === 5 ? <CertificationsAndProductsForm applicationId={applicationId} register={register} certificates={managementCertificates ?? defaultManagementCertificates} processFlow={completeProcessFlow} disabled={busy} showErrors={validatedSteps.has(5)} onCertificatesChange={(value) => setValue("certificationsAndProducts.managementCertificates", value, { shouldDirty: true })} onProcessFlowChange={(value) => { setValue("certificationsAndProducts.completeProcessFlow", value, { shouldDirty: true }); setNotice(""); }} onNotice={setNotice}/> : renderStep(step, register)}</div></section>
    </>}
    {validatedSteps.has(step) && currentStepIssues.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Bagian ini belum lengkap.</p><ul className="mt-2 list-disc space-y-1 pl-5">{currentStepIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
    {notice && <div role="alert" aria-live="polite" className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-[#073B4C]">{notice}</div>}
    <div className="flex flex-wrap justify-between gap-3"><button type="button" disabled={step === 0 || busy} onClick={() => setStep((value) => value - 1)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold"><ArrowLeft size={17}/> Sebelumnya</button><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl border border-[#087E8B] px-5 py-3 text-sm font-bold text-[#087E8B]"><Save size={17}/> Simpan Draft</button>{step < steps.length - 1 ? <button type="button" disabled={busy} onClick={() => void saveAndContinue()} className="inline-flex items-center gap-2 rounded-xl bg-[#073B4C] px-5 py-3 text-sm font-bold text-white">{busy ? <LoaderCircle className="animate-spin" size={17}/> : null} Simpan dan Lanjutkan <ArrowRight size={17}/></button> : <button type="button" disabled={busy} onClick={() => void submitQuestionnaire()} className="inline-flex items-center gap-2 rounded-xl bg-[#2E9F6B] px-5 py-3 text-sm font-bold text-white">{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Send size={17}/>} Ajukan Permohonan</button>}</div></div>
  </div>;
}

type Register = ReturnType<typeof useForm<QuestionnaireValues>>["register"];
function renderStep(step: number, register: Register) {
  if (step === 0) return <Grid>{fields("applicantInformation", register, [["upiName","Nama UPI"],["officeAddress","Alamat kantor"],["phone","Nomor telepon"],["email","E-mail"],["nib","Nomor NIB"],["brandCertificateNumber","Nomor sertifikat merek"],["yearEstablished","Tahun pendirian"],["operationalYear","Tahun mulai beroperasi"],["contactPerson","Personel penghubung dan nomor HP"]])}</Grid>;
  if (step === 6) return null;
  if (step === 7) return <div className="space-y-4">{questions.map((question, index) => <fieldset key={question} className="rounded-xl border p-4"><legend className="px-1 text-sm font-semibold">{index + 1}. {question}</legend><div className="mt-3 flex gap-5"><label className="text-sm"><input type="radio" value="YES" {...register(`qualitySystemAnswers.${index}.answer`, { required: true })} className="mr-2"/>Ya</label><label className="text-sm"><input type="radio" value="NO" {...register(`qualitySystemAnswers.${index}.answer`, { required: true })} className="mr-2"/>Tidak</label></div><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold">Keterangan<textarea rows={2} {...register(`qualitySystemAnswers.${index}.notes`)} className={inputClass}/></label><label className="text-xs font-semibold">Bukti pendukung<input {...register(`qualitySystemAnswers.${index}.evidence`)} placeholder="Nama atau lokasi berkas" className={inputClass}/></label></div></fieldset>)}</div>;
  if (step === 8) return <Grid>{fields("sniEvaluation", register, [["sniKnowledge","Pengetahuan SNI (Sudah/Belum) dan kesediaan pernyataan"],["productionCompliance","Penerapan proses sesuai SNI (Sudah/Belum) dan alasan"],["productTesting","Pengujian mutu sesuai SNI (Ada/Tidak Ada), hasil uji, dan alasan"]], true)}</Grid>;
  return <div className="space-y-5"><label className="block text-sm font-semibold">Catatan lain<textarea rows={5} maxLength={2000} {...register("otherNotes")} className={inputClass}/></label><label className="flex gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" {...register("declarationAccepted", { required: true })}/>Saya menyatakan seluruh informasi lengkap dan benar serta bersedia diaudit dan diverifikasi oleh LSPro-HP.</label><Grid>{fields("", register, [["signatoryName","Nama penandatangan"],["signatoryPosition","Jabatan"],["approvalDate","Tanggal pengesahan"]])}</Grid><label className="flex gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" {...register("electronicSignatureAccepted", { required: true })}/>Saya menyetujui penggunaan tanda tangan elektronik untuk pengesahan ini.</label><p className="text-xs text-slate-500">Tanda tangan dan cap perusahaan dapat dilampirkan melalui dokumen pendukung permohonan.</p></div>;
}
function ProductionInformationForm({ applicationId, register, flow, materials, errors, busy, onFlowChange, onMaterialsChange, onNotice }: { readonly applicationId: string; readonly register: Register; readonly flow: ProductionFlowData; readonly materials: ProductionMaterialsData; readonly errors: ProductionMaterialsErrors; readonly busy: boolean; readonly onFlowChange: (value: ProductionFlowData) => void; readonly onMaterialsChange: (value: ProductionMaterialsData) => void; readonly onNotice: (message: string) => void }) { return <div className="space-y-7"><Grid>{fields("productionInformation", register, [["sameProductionLocation","Lokasi produksi sama dengan alamat pemohon (Ya/Tidak)"],["facility","Nama, alamat, dan telepon fasilitas"],["organizationStructure","Struktur organisasi dan personel"],["responsiblePerson","Penanggung jawab produksi/mutu"]], true)}</Grid><ProductionFlowForm applicationId={applicationId} value={flow} disabled={busy} onChange={onFlowChange} onNotice={onNotice}/><ProductionMaterialsForm applicationId={applicationId} value={materials} errors={errors} onChange={onMaterialsChange} onNotice={onNotice}/></div>; }
function CertificationsAndProductsForm({ applicationId, register, certificates, processFlow, disabled, showErrors, onCertificatesChange, onProcessFlowChange, onNotice }: { readonly applicationId: string; readonly register: Register; readonly certificates: ManagementCertificates; readonly processFlow: ProcessFlowDocument | null; readonly disabled: boolean; readonly showErrors: boolean; readonly onCertificatesChange: (value: ManagementCertificates) => void; readonly onProcessFlowChange: (value: ProcessFlowDocument) => void; readonly onNotice: (message: string) => void }) { return <Grid><ManagementCertificatesTable applicationId={applicationId} value={certificates} disabled={disabled} onChange={onCertificatesChange} onNotice={onNotice}/><ProcessFlowDocumentUpload applicationId={applicationId} value={processFlow} disabled={disabled} onChange={onProcessFlowChange} onNotice={onNotice} error={showErrors && !processFlow ? "Alur lengkap produksi/pengolahan wajib diunggah." : undefined}/>{fields("certificationsAndProducts", register, [["certifiedProducts","Produk yang akan/telah disertifikasi: jenis dan merek"]], true)}</Grid>; }
function Grid({ children }: { readonly children: React.ReactNode }) { return <div className="grid gap-5 md:grid-cols-2">{children}</div>; }
function ProductInformationForm({ applicationId, register, photos, busy, onPhotosChange, onNotice }: { readonly applicationId: string; readonly register: Register; readonly photos: PackagingPhotos; readonly busy: boolean; readonly onPhotosChange: (value: PackagingPhotos) => void; readonly onNotice: (message: string) => void }) {
  return <Grid>
    {fields("productInformation", register, [["brand","Merek produk"],["productType","Jenis produk"]])}
    <label className="text-sm font-semibold">Berat bersih
      <input type="number" inputMode="decimal" min="0" step="any" placeholder="Contoh: 500" {...register("productInformation.netWeight")} className={inputClass}/>
    </label>
    <label className="text-sm font-semibold">Satuan
      <select {...register("productInformation.netWeightUnit")} defaultValue="" className={inputClass}>
        <option value="" disabled>Pilih satuan</option>
        {netWeightUnits.map((unit) => <option key={unit} value={unit}>{unit === "lainnya" ? "Lainnya" : unit}</option>)}
      </select>
    </label>
    <label className="text-sm font-semibold">Masa simpan (tahun)
      <input type="number" inputMode="numeric" min="0" step="1" placeholder="Contoh: 2" {...register("productInformation.shelfLife")} className={inputClass}/>
    </label>
    <label className="text-sm font-semibold">Tanggal produksi
      <input type="date" {...register("productInformation.productionDateFormat")} className={inputClass}/>
    </label>
    <label className="text-sm font-semibold">Tanggal kedaluwarsa
      <input type="date" {...register("productInformation.expiryDateFormat")} className={inputClass}/>
    </label>
    {fields("productInformation", register, [["sni","SNI yang digunakan"],["labelInformation","Label dan informasi pada label"],["packagingType","Jenis, bahan, dan bentuk kemasan"]], true)}
    <label className="text-sm font-semibold md:col-span-2">Kapasitas produksi per hari
      <input type="number" inputMode="decimal" min="0" step="any" {...register("productInformation.productionCapacity")} className={inputClass}/>
    </label>
    <label className="text-sm font-semibold md:col-span-2">Produksi rata-rata per hari
      <input type="number" inputMode="decimal" min="0" step="any" {...register("productInformation.averageProduction")} className={inputClass}/>
    </label>
    <fieldset className="grid gap-5 rounded-xl border border-slate-200 p-4 md:col-span-2 md:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">Kebutuhan es</legend>
      <label className="text-sm font-semibold">Jumlah kebutuhan per hari
        <input type="number" inputMode="decimal" min="0" step="any" placeholder="Contoh: 100" {...register("productInformation.iceRequirementAmount")} className={inputClass}/>
      </label>
      <label className="text-sm font-semibold">Satuan kebutuhan
        <select {...register("productInformation.iceRequirementUnit")} defaultValue="" className={inputClass}>
          <option value="" disabled>Pilih satuan</option>
          {iceRequirementUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold md:col-span-2">Asal es
        <input type="text" placeholder="Contoh: Pabrik es Mina Jaya" {...register("productInformation.iceOrigin")} className={inputClass}/>
      </label>
    </fieldset>
    <fieldset className="rounded-xl border border-slate-200 p-4 md:col-span-2">
      <legend className="px-1 text-sm font-semibold">Foto kemasan</legend>
      <p className="mb-4 text-xs font-normal text-slate-500">Unggah gambar JPG atau PNG untuk setiap sisi kemasan. Ukuran maksimal 10 MB per gambar.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {([['front', 'Depan'], ['back', 'Belakang'], ['side', 'Samping']] as const).map(([position, label]) => <PackagingPhotoUpload key={position} applicationId={applicationId} label={label} value={photos[position]} disabled={busy} onUploaded={(photo) => onPhotosChange({ ...photos, [position]: photo })} onNotice={onNotice}/>)}
      </div>
    </fieldset>
  </Grid>;
}
function PackagingPhotoUpload({ applicationId, label, value, disabled, onUploaded, onNotice }: { readonly applicationId: string; readonly label: string; readonly value?: PackagingPhoto; readonly disabled: boolean; readonly onUploaded: (photo: PackagingPhoto) => void; readonly onNotice: (message: string) => void }) {
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true); onNotice("");
    try {
      const formData = new FormData(); formData.set("file", file); formData.set("documentType", "OTHER"); formData.set("documentName", `Foto kemasan ${label.toLowerCase()}`);
      const response = await fetch(`/api/certification-applications/${applicationId}/documents`, { method: "POST", body: formData });
      const result = await response.json() as { success: boolean; message: string; data?: PackagingPhoto };
      if (result.success && result.data) { onUploaded(result.data); onNotice(`Foto kemasan ${label.toLowerCase()} berhasil diunggah.`); } else onNotice(result.message);
    } catch { onNotice("Foto kemasan gagal diunggah. Silakan coba kembali."); } finally { setUploading(false); }
  }
  return <label className="group relative flex min-h-44 cursor-pointer flex-col items-center justify-end overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-[#0FA3B1] hover:bg-cyan-50/50">
    {value && !uploading && <Image src={`/api/certification-applications/${applicationId}/documents/${value.id}?preview=1`} alt={`Pratinjau foto kemasan ${label.toLowerCase()}`} fill unoptimized sizes="(min-width: 768px) 33vw, 100vw" className="object-cover"/>}
    {value && !uploading && <div className="absolute inset-0 bg-gradient-to-t from-[#073B4C]/90 via-[#073B4C]/10 to-transparent transition group-hover:from-[#073B4C]"/>}
    <span className="relative z-10 flex max-w-full flex-col items-center">
      {uploading ? <LoaderCircle className="mb-2 animate-spin text-[#087E8B]" size={24}/> : value ? <ImageIcon className="mb-2 text-white" size={24}/> : <Upload className="mb-2 text-[#087E8B]" size={24}/>}<span className={`text-sm font-semibold ${value && !uploading ? "text-white" : ""}`}>Foto {label}</span><span className={`mt-1 max-w-full truncate text-xs font-normal ${value && !uploading ? "text-white/90" : "text-slate-500"}`}>{uploading ? "Mengunggah..." : value?.originalFileName ?? "Pilih gambar"}</span>
    </span>
    <input type="file" accept="image/jpeg,image/png" disabled={disabled || uploading} className="sr-only" aria-label={`Unggah foto kemasan ${label.toLowerCase()}`} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }}/>
  </label>;
}
function validateProductionMaterials(value: ProductionMaterialsData): ProductionMaterialsErrors {
  const errors: ProductionMaterialsErrors = {};
  if (!value.rawMaterials.length) errors.rawMaterials = "Minimal satu bahan baku harus ditambahkan.";
  value.rawMaterials.forEach((row, index) => { if (!row.name.trim()) errors[`rawMaterials.${index}.name`] = "Nama bahan baku wajib diisi."; if (!row.origin) errors[`rawMaterials.${index}.origin`] = "Asal bahan baku wajib diisi."; if (row.origin === "Lainnya" && !row.otherOrigin.trim()) errors[`rawMaterials.${index}.otherOrigin`] = "Asal bahan baku lainnya wajib diisi."; if (row.origin && row.origin !== "Produksi sendiri" && !row.supplierName.trim()) errors[`rawMaterials.${index}.supplierName`] = "Nama pemasok wajib diisi karena bahan baku berasal dari pihak luar."; if (!row.requirements.trim()) errors[`rawMaterials.${index}.requirements`] = "Persyaratan bahan baku wajib diisi."; });
  value.additives.forEach((row, index) => { if (!row.name.trim()) errors[`additives.${index}.name`] = "Nama bahan tambahan wajib diisi."; if (!row.supplierName.trim()) errors[`additives.${index}.supplierName`] = "Nama pemasok wajib diisi."; if (!row.origin) errors[`additives.${index}.origin`] = "Asal bahan tambahan wajib diisi."; if (row.origin === "Lainnya" && !row.otherOrigin.trim()) errors[`additives.${index}.otherOrigin`] = "Asal lainnya wajib diisi."; if (!row.function.trim()) errors[`additives.${index}.function`] = "Fungsi bahan wajib diisi."; if (!row.hasPermit) errors[`additives.${index}.hasPermit`] = "Status izin edar wajib dipilih."; if (row.hasPermit === "YES" && !row.permitNumber.trim()) errors[`additives.${index}.permitNumber`] = "Nomor izin edar wajib diisi."; if (!row.halalStatus) errors[`additives.${index}.halalStatus`] = "Status halal wajib dipilih."; if (row.halalStatus === "CERTIFIED") { if (!row.halalCertificateNumber.trim()) errors[`additives.${index}.halalCertificateNumber`] = "Nomor sertifikat halal wajib diisi."; if (!row.halalValidUntil) errors[`additives.${index}.halalValidUntil`] = "Masa berlaku sertifikat halal wajib diisi."; if (!row.halalCertificate) errors[`additives.${index}.halalCertificate`] = "Berkas sertifikat halal wajib diunggah."; } });
  value.qualityDocuments.forEach((row, index) => { if (!row.name.trim()) errors[`qualityDocuments.${index}.name`] = "Nama dokumen wajib diisi."; if (!row.number.trim()) errors[`qualityDocuments.${index}.number`] = "Nomor dokumen wajib diisi."; if (!row.revision.trim()) errors[`qualityDocuments.${index}.revision`] = "Nomor revisi wajib diisi."; if (!row.effectiveDate) errors[`qualityDocuments.${index}.effectiveDate`] = "Tanggal berlaku wajib diisi."; if (!row.file) errors[`qualityDocuments.${index}.file`] = "Berkas dokumen pengendalian mutu wajib diunggah."; });
  if (!value.equipment.length) errors.equipment = "Minimal satu peralatan produksi harus ditambahkan.";
  value.equipment.forEach((row, index) => { if (!row.name.trim()) errors[`equipment.${index}.name`] = "Nama mesin atau alat wajib diisi."; if (!row.specification.trim()) errors[`equipment.${index}.specification`] = "Spesifikasi wajib diisi."; if (!Number.isInteger(row.quantity) || row.quantity < 1) errors[`equipment.${index}.quantity`] = "Jumlah unit minimal satu."; if (row.requiresCalibration === null) errors[`equipment.${index}.requiresCalibration`] = "Pilih kebutuhan kalibrasi atau tera."; if (row.requiresCalibration) { if (!row.calibrationCertificateNumber.trim()) errors[`equipment.${index}.calibrationCertificateNumber`] = "Nomor sertifikat kalibrasi wajib diisi."; if (!row.calibrationDate) errors[`equipment.${index}.calibrationDate`] = "Tanggal kalibrasi wajib diisi."; if (!row.calibrationValidUntil) errors[`equipment.${index}.calibrationValidUntil`] = "Masa berlaku wajib diisi."; if (!row.calibrationIssuer.trim()) errors[`equipment.${index}.calibrationIssuer`] = "Lembaga penerbit wajib diisi."; if (!row.document) errors[`equipment.${index}.document`] = "Sertifikat kalibrasi/tera wajib diunggah."; } else if (row.requiresCalibration === false && !row.noCalibrationReason.trim()) errors[`equipment.${index}.noCalibrationReason`] = "Alasan tidak memerlukan kalibrasi/tera wajib diisi."; if (!row.ownershipStatus) errors[`equipment.${index}.ownershipStatus`] = "Status kepemilikan wajib dipilih."; if (row.ownershipStatus === "RENTED") { if (!row.ownerName.trim()) errors[`equipment.${index}.ownerName`] = "Nama pemilik alat wajib diisi."; if (!row.rentalAgreementNumber.trim()) errors[`equipment.${index}.rentalAgreementNumber`] = "Nomor perjanjian sewa wajib diisi."; if (!row.rentalStartDate) errors[`equipment.${index}.rentalStartDate`] = "Tanggal mulai sewa wajib diisi."; if (!row.rentalEndDate) errors[`equipment.${index}.rentalEndDate`] = "Tanggal berakhir sewa wajib diisi."; if (!row.document) errors[`equipment.${index}.document`] = "Dokumen perjanjian sewa wajib diunggah."; } });
  return errors;
}
function validateHumanResources(value: HumanResourcesData) { const errors: Record<string,string> = {}; value.tenagaKerja.forEach((row,index) => { if ((row.jumlahTetap > 0 || row.jumlahTidakTetap > 0) && !row.kualifikasi.trim()) errors[`tenagaKerja.${index}.kualifikasi`] = "Kualifikasi wajib diisi karena terdapat tenaga kerja pada tingkat pendidikan ini."; }); if (value.memilikiTenagaAhliAsing === null) errors.memilikiTenagaAhliAsing = "Pilih Ya atau Tidak."; if (value.memilikiTenagaAhliAsing && value.tenagaAhliAsing.length === 0) errors.tenagaAhliAsing = "Tambahkan minimal satu tenaga ahli asing."; value.tenagaAhliAsing.forEach((row,index) => { (["kualifikasi","nama","negaraAsal","keterangan"] as const).forEach((field) => { if (!row[field].trim()) errors[`tenagaAhliAsing.${index}.${field}`] = `${field === "negaraAsal" ? "Negara asal" : field[0].toUpperCase()+field.slice(1)} wajib diisi.`; }); if (row.kualifikasi === "Lainnya" && !row.kualifikasiLainnya.trim()) errors[`tenagaAhliAsing.${index}.kualifikasiLainnya`] = "Kualifikasi lainnya wajib diisi."; }); if (value.pernahMengikutiPelatihan === null) errors.pernahMengikutiPelatihan = "Pilih Ya atau Tidak."; if (value.pernahMengikutiPelatihan && value.pelatihan.length === 0) errors.pelatihan = "Tambahkan minimal satu data pelatihan."; value.pelatihan.forEach((row,index) => { (["namaPelatihan","namaPeserta","penyelenggara"] as const).forEach((field) => { if (!row[field].trim()) errors[`pelatihan.${index}.${field}`] = "Field ini wajib diisi."; }); if (!row.tahun || row.tahun > new Date().getFullYear()) errors[`pelatihan.${index}.tahun`] = "Tahun wajib diisi dan tidak boleh melebihi tahun berjalan."; }); return errors; }
interface StepErrorGroups {
  readonly productionErrors?: ProductionMaterialsErrors;
  readonly legalityErrors?: BusinessLegalityErrors;
  readonly workforceErrors?: Record<string, string>;
  readonly channelErrors?: MarketingChannelsErrors;
}
function missingFields(section: Row, definitions: readonly (readonly [string, string])[]) { return definitions.filter(([name]) => !String(section[name] ?? "").trim()).map(([, label]) => `${label} wajib diisi`); }
function collectValidationMessages(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return [...new Set(value.flatMap(collectValidationMessages))];
  if (value && typeof value === "object") return [...new Set(Object.values(value).flatMap(collectValidationMessages))];
  return [];
}
function getStepIssues(step: number, value: QuestionnaireValues, groups: StepErrorGroups = {}): string[] {
  if (step === 0) return missingFields(value.applicantInformation, [["upiName","Nama UPI"],["officeAddress","Alamat kantor"],["phone","Nomor telepon"],["email","E-mail"],["nib","Nomor NIB"],["yearEstablished","Tahun pendirian"],["operationalYear","Tahun mulai beroperasi"],["contactPerson","Personel penghubung"]]);
  if (step === 1) { const issues = missingFields(value.productInformation as Row, [["brand","Merek produk"],["productType","Jenis produk"],["netWeight","Berat bersih"],["netWeightUnit","Satuan berat"],["shelfLife","Masa simpan"],["productionDateFormat","Tanggal produksi"],["expiryDateFormat","Tanggal kedaluwarsa"],["sni","SNI yang digunakan"],["labelInformation","Informasi label"],["packagingType","Jenis kemasan"],["productionCapacity","Kapasitas produksi"],["averageProduction","Produksi rata-rata"],["iceRequirementAmount","Kebutuhan es"],["iceRequirementUnit","Satuan kebutuhan es"],["iceOrigin","Asal es"]]); const photos = value.productInformation.productPhotos; if (!photos?.front || !photos.back || !photos.side) issues.push("Foto kemasan depan, belakang, dan samping wajib diunggah"); return issues; }
  if (step === 2) { const issues = missingFields(value.productionInformation as unknown as Row, [["sameProductionLocation","Status lokasi produksi"],["facility","Data fasilitas"],["organizationStructure","Struktur organisasi"],["responsiblePerson","Penanggung jawab produksi/mutu"]]); const flow = value.productionInformation.processFlow; if (flow.method === "DYNAMIC" && flow.steps.some((item) => !item.activity.trim() || !item.responsiblePerson.trim())) issues.push("Seluruh kegiatan dan penanggung jawab alur proses wajib diisi"); if (flow.method === "UPLOAD" && !flow.document) issues.push("File flowchart wajib diunggah"); const errors = groups.productionErrors ?? validateProductionMaterials(value.productionInformation); if (Object.keys(errors).length) issues.push("Data bahan baku, bahan tambahan, dokumen mutu, atau peralatan belum lengkap"); return issues; }
  if (step === 3) return Object.keys(groups.legalityErrors ?? validateBusinessLegality(value.businessLegality)).length ? ["Data dan dokumen legalitas UPI belum lengkap"] : [];
  if (step === 4) return Object.keys(groups.workforceErrors ?? validateHumanResources(value.humanResources)).length ? ["Data sumber daya manusia belum lengkap"] : [];
  if (step === 5) { const issues: string[] = []; if (!value.certificationsAndProducts.completeProcessFlow) issues.push("Alur lengkap produksi/pengolahan wajib diunggah"); if (!value.certificationsAndProducts.certifiedProducts?.trim()) issues.push("Produk yang akan atau telah disertifikasi wajib diisi"); return issues; }
  if (step === 6) { const errors = groups.channelErrors ?? validateMarketingChannels(value.marketingChannels); return errors.channels || errors.total ? [errors.channels ?? errors.total ?? "Data jalur pemasaran belum lengkap"] : []; }
  if (step === 7) { const unanswered = value.qualitySystemAnswers.filter((answer) => answer.answer === null).length; return unanswered ? [`${unanswered} pertanyaan sistem mutu belum dijawab`] : []; }
  if (step === 8) { const issues: string[] = []; const sni = value.sniEvaluation; if (!sni.sniKnowledge) issues.push("Status pengetahuan SNI wajib dipilih"); if (sni.sniKnowledge === "NO" && !sni.readinessStatement.trim()) issues.push("Pernyataan kesiapan memahami SNI wajib diisi"); if (!sni.productionCompliance) issues.push("Status penerapan proses sesuai SNI wajib dipilih"); if (sni.productionCompliance === "NO" && !sni.nonComplianceReason.trim()) issues.push("Alasan proses belum sesuai SNI wajib diisi"); if (!sni.productTesting) issues.push("Status pengujian produk wajib dipilih"); if (sni.productTesting === "YES" && !sni.testingDocument) issues.push("Hasil pengujian wajib diunggah"); if (sni.productTesting === "NO" && !sni.noTestingReason.trim()) issues.push("Alasan belum melakukan pengujian wajib diisi"); return issues; }
  const issues: string[] = []; if (!value.declarationAccepted) issues.push("Pernyataan kebenaran data wajib disetujui"); if (!value.signatoryName.trim()) issues.push("Nama penandatangan wajib diisi"); if (!value.signatoryPosition.trim()) issues.push("Jabatan penandatangan wajib diisi"); if (!value.approvalDate) issues.push("Tanggal pengesahan wajib diisi"); if (!value.electronicSignatureAccepted) issues.push("Persetujuan tanda tangan elektronik wajib dicentang"); return issues;
}
function fields(prefix: string, register: Register, definitions: readonly (readonly [string, string])[], multiline = false) { return definitions.map(([name, label]) => { const path = (prefix ? `${prefix}.${name}` : name) as Parameters<Register>[0]; return <label key={path} className={`text-sm font-semibold ${multiline ? "md:col-span-2" : ""}`}>{label}{multiline ? <textarea rows={3} {...register(path)} className={inputClass}/> : <input type={name === "approvalDate" ? "date" : "text"} {...register(path)} className={inputClass}/>}</label>; }); }

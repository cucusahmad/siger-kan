export interface CompletenessSource {
  readonly name: string | null;
  readonly businessType: string | null;
  readonly businessScale: string | null;
  readonly yearEstablished: number | null;
  readonly description: string | null;
  readonly provinceId: string | null;
  readonly regencyId: string | null;
  readonly districtId: string | null;
  readonly villageId: string | null;
  readonly addressLine: string | null;
  readonly postalCode: string | null;
  readonly picName: string | null;
  readonly picPosition: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly nib: string | null;
  readonly taxNumber: string | null;
  readonly commodityIds: readonly string[];
}

export interface ProfileCompleteness {
  readonly completed: number;
  readonly total: number;
  readonly percentage: number;
  readonly missingLabels: readonly string[];
}

const completenessFields = [
  ["name", "Nama usaha"], ["businessType", "Jenis usaha"], ["businessScale", "Skala usaha"],
  ["yearEstablished", "Tahun berdiri"], ["description", "Deskripsi usaha"], ["provinceId", "Provinsi"],
  ["regencyId", "Kabupaten/Kota"], ["districtId", "Kecamatan"], ["villageId", "Desa/Kelurahan"],
  ["addressLine", "Alamat lengkap"], ["postalCode", "Kode pos"], ["picName", "Nama PIC"],
  ["picPosition", "Jabatan PIC"], ["email", "Email usaha"], ["phone", "Nomor telepon"],
  ["nib", "NIB"], ["taxNumber", "NPWP"], ["commodityIds", "Minimal satu komoditas"],
] as const satisfies readonly (readonly [keyof CompletenessSource, string])[];

function isComplete(value: CompletenessSource[keyof CompletenessSource]): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

export function calculateProfileCompleteness(source: CompletenessSource): ProfileCompleteness {
  const missingLabels = completenessFields.filter(([key]) => !isComplete(source[key])).map(([, label]) => label);
  const total = completenessFields.length;
  const completed = total - missingLabels.length;
  return { completed, total, percentage: Math.round((completed / total) * 100), missingLabels };
}

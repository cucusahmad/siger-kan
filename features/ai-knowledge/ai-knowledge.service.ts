import type { AiChatRequest } from "./ai-knowledge.schema";

const HUGGING_FACE_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b:cheapest";
const REQUEST_TIMEOUT_MS = 45_000;
const systemPrompt = `Anda adalah Asisten AI SIGER-KAN untuk layanan mutu dan perikanan Indonesia.
Jawab dalam Bahasa Indonesia yang jelas, profesional, ringkas, dan mudah ditindaklanjuti.
Fokus pada mutu dan keamanan hasil perikanan, pengujian laboratorium, sertifikasi, pembinaan, serta penggunaan layanan SIGER-KAN.
Jangan mengarang peraturan, standar, hasil uji, atau kebijakan. Jika kepastian membutuhkan dokumen resmi atau petugas berwenang, nyatakan keterbatasan dan sarankan pengguna melakukan verifikasi.
Jangan meminta atau mengungkap kata sandi, token, data pribadi sensitif, maupun rahasia bisnis.
Jelaskan bahwa jawaban AI bukan keputusan resmi, sertifikat, diagnosis, atau pengganti konsultasi dengan petugas berwenang.`;

interface HuggingFaceResponse {
  readonly choices?: readonly { readonly message?: { readonly content?: string } }[];
  readonly error?: { readonly message?: string } | string;
}

export class AiKnowledgeError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "AiKnowledgeError"; }
}

export async function requestAiConsultation(input: AiChatRequest): Promise<{ readonly answer: string; readonly model: string }> {
  const token = process.env.HUGGINGFACE_TOKEN?.trim();
  if (!token) throw new AiKnowledgeError("Layanan AI belum dikonfigurasi oleh administrator.", 503);
  const model = process.env.HUGGINGFACE_MODEL?.trim() || DEFAULT_MODEL;
  const response = await fetch(HUGGING_FACE_CHAT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, temperature: 0.3, max_tokens: 900, messages: [{ role: "system", content: systemPrompt }, ...input.messages] }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => null) as HuggingFaceResponse | null;
  if (!response.ok) {
    const providerMessage = typeof payload?.error === "string" ? payload.error : payload?.error?.message;
    console.error("Hugging Face consultation failed", { status: response.status, model, providerMessage });
    throw new AiKnowledgeError(response.status === 401 || response.status === 403
      ? "Kredensial layanan AI tidak valid atau tidak memiliki izin inference."
      : response.status === 429 ? "Kuota layanan AI sedang habis atau batas permintaan tercapai. Silakan coba kembali nanti."
        : "Layanan AI sedang tidak tersedia. Silakan coba kembali beberapa saat lagi.", response.status === 429 ? 429 : 502);
  }
  const answer = payload?.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new AiKnowledgeError("Layanan AI tidak memberikan jawaban. Silakan ulangi pertanyaan Anda.", 502);
  return { answer, model };
}

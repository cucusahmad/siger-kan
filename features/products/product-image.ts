const imageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const maximumImageBytes = 5 * 1024 * 1024;

export async function parseProductImage(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) throw new Error("IMAGE_REQUIRED");
  const extension = imageTypes.get(file.type);
  if (!extension) throw new Error("INVALID_IMAGE_TYPE");
  if (file.size > maximumImageBytes) throw new Error("IMAGE_TOO_LARGE");
  const altText = String(formData.get("altText") ?? "").trim();
  if (altText.length > 200) throw new Error("ALT_TEXT_TOO_LONG");
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    extension,
    mimeType: file.type,
    originalName: file.name.slice(0, 255),
    sizeBytes: file.size,
    altText: altText || null,
  };
}


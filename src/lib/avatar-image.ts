const AVATAR_SIZE = 128;
const JPEG_QUALITY = 0.82;

/**
 * Client-only. Reads an image file, center-crops it to a square, downsizes to a small avatar
 * size, and re-encodes as a JPEG data URL — small enough (a few KB) to store directly in
 * Account.avatarUrl without needing any external file-storage service.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not supported");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

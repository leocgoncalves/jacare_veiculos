import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

const UPLOAD_RELATIVE_DIR = "uploads/vehicles";

type SaveImageOptions = {
  targetRelativeDir?: string;
  maxWidth?: number;
  quality?: number;
};

export async function saveImageAsWebp(
  file: File,
  options: SaveImageOptions = {},
) {
  const {
    targetRelativeDir = UPLOAD_RELATIVE_DIR,
    maxWidth = 1200,
    quality = 82,
  } = options;
  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const fileName = `${randomUUID()}.webp`;
  const targetDir = path.join(process.cwd(), "public", targetRelativeDir);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), outputBuffer);

  return {
    publicUrl: `/${targetRelativeDir}/${fileName}`,
    fileName,
  };
}

export async function saveVehicleImageAsWebp(file: File) {
  return saveImageAsWebp(file, { targetRelativeDir: UPLOAD_RELATIVE_DIR });
}

export async function saveVideoFile(
  file: File,
  targetRelativeDir: string = "uploads/branding",
) {
  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);

  // Valida tipo de vídeo
  if (!file.type.startsWith("video/")) {
    throw new Error("Arquivo deve ser um vídeo");
  }

  // Mantém extensão original (webm, mp4, etc)
  const originalExtension = file.name.split(".").pop() || "mp4";
  const fileName = `${randomUUID()}.${originalExtension}`;
  const targetDir = path.join(process.cwd(), "public", targetRelativeDir);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), inputBuffer);

  return {
    publicUrl: `/${targetRelativeDir}/${fileName}`,
    fileName,
  };
}

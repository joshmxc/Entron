import fs from "fs/promises";
import path from "path";
import { config } from "../config";

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export function localPath(...parts: string[]): string {
  return path.join(config.storage.uploadDir, ...parts);
}

export function publicUrl(relativePath: string): string {
  return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore if not exists
  }
}

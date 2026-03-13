import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads');

export async function saveUploadedFile(
  subDir: string,
  file: File,
): Promise<{ filePath: string; fileName: string; fileSize: number; mimeType: string }> {
  const dir = join(UPLOAD_DIR, subDir);
  await mkdir(dir, { recursive: true });

  const uuid = crypto.randomUUID();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${uuid}-${safeFileName}`;
  const filePath = join(dir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    filePath: `${subDir}/${fileName}`,
    fileName: file.name,
    fileSize: buffer.length,
    mimeType: file.type,
  };
}

export async function deleteUploadedFile(filePath: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, filePath));
  } catch {
    // File may already be deleted
  }
}

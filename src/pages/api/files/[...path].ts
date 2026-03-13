import type { APIRoute } from 'astro';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response('Non autorise', { status: 401 });
  }

  const filePath = params.path;
  if (!filePath) return new Response('Not found', { status: 404 });

  // Prevent path traversal
  const safePath = filePath.replace(/\.\./g, '');
  const fullPath = join(process.cwd(), 'data', 'uploads', safePath);

  try {
    const data = await readFile(fullPath);
    const ext = fullPath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
      gif: 'image/gif',
    };
    return new Response(data, {
      headers: {
        'Content-Type': mimeTypes[ext ?? ''] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Fichier introuvable', { status: 404 });
  }
};

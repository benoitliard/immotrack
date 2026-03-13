import type { APIRoute } from 'astro';
import { db } from '~/lib/db';
import { propertyPhotos, properties, transactions } from '~/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { json, error } from '~/lib/api-response';
import { saveUploadedFile, deleteUploadedFile } from '~/lib/upload';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Verify that the current user owns a transaction linked to this property */
async function verifyPropertyAccess(propertyId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'admin') return true;

  const [tx] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.propertyId, propertyId), eq(transactions.brokerId, userId)));

  return !!tx;
}

// GET /api/properties/[id]/photos — list photos ordered by orderIndex
export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return error('Non autorise', 401);

  const { id } = params;
  if (!id) return error('ID requis', 400);

  const photos = await db
    .select()
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, id))
    .orderBy(asc(propertyPhotos.orderIndex));

  return json({ photos });
};

// POST /api/properties/[id]/photos — upload a photo
export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorise', 401);
  }

  const { id } = params;
  if (!id) return error('ID requis', 400);

  // Verify the property exists
  const [property] = await db.select().from(properties).where(eq(properties.id, id));
  if (!property) return error('Propriete introuvable', 404);

  // Verify user has access
  const hasAccess = await verifyPropertyAccess(id, user.id, user.role ?? '');
  if (!hasAccess) return error('Acces refuse', 403);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const caption = formData.get('caption') as string | null;

  if (!file || !(file instanceof File)) {
    return error('Aucun fichier fourni', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return error('Le fichier depasse la taille maximale de 10 Mo', 400);
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return error('Type de fichier non accepte. Formats acceptes : JPEG, PNG, WebP', 400);
  }

  // Save file to disk
  const saved = await saveUploadedFile(`properties/${id}`, file);

  // Get current max orderIndex
  const existing = await db
    .select({ orderIndex: propertyPhotos.orderIndex })
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, id))
    .orderBy(asc(propertyPhotos.orderIndex));

  const nextOrder = existing.length > 0 ? (existing[existing.length - 1].orderIndex + 1) : 0;
  const isCover = existing.length === 0; // First photo becomes cover

  const [photo] = await db
    .insert(propertyPhotos)
    .values({
      propertyId: id,
      url: saved.filePath,
      caption: caption ?? null,
      orderIndex: nextOrder,
      isCover,
    })
    .returning();

  return json({ photo }, 201);
};

// DELETE /api/properties/[id]/photos?photoId=xxx — remove a photo
export const DELETE: APIRoute = async ({ params, url, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorise', 401);
  }

  const { id } = params;
  if (!id) return error('ID requis', 400);

  const photoId = url.searchParams.get('photoId');
  if (!photoId) return error('photoId requis', 400);

  // Verify user has access
  const hasAccess = await verifyPropertyAccess(id, user.id, user.role ?? '');
  if (!hasAccess) return error('Acces refuse', 403);

  // Fetch photo
  const [photo] = await db
    .select()
    .from(propertyPhotos)
    .where(and(eq(propertyPhotos.id, photoId), eq(propertyPhotos.propertyId, id)));

  if (!photo) return error('Photo introuvable', 404);

  // Delete from disk
  await deleteUploadedFile(photo.url);

  // Delete DB record
  await db.delete(propertyPhotos).where(eq(propertyPhotos.id, photoId));

  return json({ success: true });
};

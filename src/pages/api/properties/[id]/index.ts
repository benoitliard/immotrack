import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '~/lib/db';
import { properties, transactions } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, error } from '~/lib/api-response';

const UpdatePropertySchema = z.object({
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(200).optional(),
  province: z.string().min(1).max(50).optional(),
  postalCode: z.string().max(10).nullable().optional(),
  propertyType: z.string().min(1).max(100).optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().int().min(0).nullable().optional(),
  area: z.number().int().min(0).nullable().optional(),
  listingPrice: z.number().int().min(0).nullable().optional(),
  mlsNumber: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  descriptionLong: z.string().nullable().optional(),
  yearBuilt: z.number().int().min(1600).max(2100).nullable().optional(),
  lotArea: z.number().int().min(0).nullable().optional(),
  livingArea: z.number().int().min(0).nullable().optional(),
  floors: z.number().int().min(0).nullable().optional(),
  parking: z.string().max(200).nullable().optional(),
  heating: z.string().max(200).nullable().optional(),
  waterHeater: z.string().max(200).nullable().optional(),
  municipalTax: z.number().int().min(0).nullable().optional(),
  schoolTax: z.number().int().min(0).nullable().optional(),
  condoFees: z.number().int().min(0).nullable().optional(),
  zoning: z.string().max(100).nullable().optional(),
  lot: z.string().max(100).nullable().optional(),
  nearbyServices: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  virtualTourUrl: z.string().url().nullable().optional(),
});

// PUT /api/properties/[id] — update property details (broker only)
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorise', 401);
  }

  const { id } = params;
  if (!id) return error('ID requis', 400);

  // Verify property exists
  const [property] = await db.select().from(properties).where(eq(properties.id, id));
  if (!property) return error('Propriete introuvable', 404);

  // Verify user has access (owns a transaction linked to this property)
  if (user.role !== 'admin') {
    const [tx] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.propertyId, id), eq(transactions.brokerId, user.id)));

    if (!tx) return error('Acces refuse', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Corps de requete invalide', 400);
  }

  const parsed = UpdatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Donnees invalides', details: parsed.error.errors }, 422);
  }

  const data = parsed.data;
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateValues[key] = value;
    }
  }

  const [updated] = await db
    .update(properties)
    .set(updateValues)
    .where(eq(properties.id, id))
    .returning();

  return json({ property: updated });
};

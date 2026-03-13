import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '~/lib/db';
import { transactions, properties, transactionStages, stageTemplates, activityLog } from '~/db/schema';
import { eq, desc } from 'drizzle-orm';
import { json, error } from '~/lib/api-response';

// GET /api/transactions — list current broker's transactions
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorisé', 401);
  }

  const list = await db
    .select()
    .from(transactions)
    .where(eq(transactions.brokerId, user.id))
    .orderBy(desc(transactions.createdAt));

  return json({ transactions: list });
};

const CreateTransactionSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  type: z.enum(['purchase', 'sale', 'rental']),
  closing_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // Property fields
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  property_type: z.string().min(1, 'Le type de propriété est requis'),
  bedrooms: z.coerce.number().int().min(0).nullable().optional(),
  bathrooms: z.coerce.number().int().min(0).nullable().optional(),
  listing_price: z.coerce.number().int().min(0).nullable().optional(),
});

// POST /api/transactions — create a new transaction
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorisé', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Corps de requête invalide', 400);
  }

  const parsed = CreateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return error(firstError?.message ?? 'Données invalides', 422);
  }

  const data = parsed.data;

  const { property, transaction, stages } = await db.transaction(async (tx) => {
    // 1. Create the property
    const [property] = await tx
      .insert(properties)
      .values({
        address: data.address,
        city: data.city,
        propertyType: data.property_type,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        listingPrice: data.listing_price ?? null,
        createdBy: user.id,
      })
      .returning();

    // 2. Create the transaction
    const [transaction] = await tx
      .insert(transactions)
      .values({
        title: data.title,
        type: data.type,
        brokerId: user.id,
        propertyId: property.id,
        closingDate: data.closing_date ? new Date(data.closing_date) : null,
        notes: data.notes ?? null,
        currentStageOrder: 1,
      })
      .returning();

    // 3. Create stages from template
    const templates = await tx
      .select()
      .from(stageTemplates)
      .where(eq(stageTemplates.transactionType, data.type))
      .orderBy(stageTemplates.orderIndex);

    if (templates.length > 0) {
      const stageValues = templates.map((t, index) => ({
        transactionId: transaction.id,
        name: t.name,
        description: t.description,
        orderIndex: t.orderIndex,
        status: (index === 0 ? 'current' : 'pending') as 'current' | 'pending',
      }));
      await tx.insert(transactionStages).values(stageValues);
    }

    // 4. Log activity
    await tx.insert(activityLog).values({
      transactionId: transaction.id,
      userId: user.id,
      action: 'Transaction créée',
      metadata: JSON.stringify({ title: transaction.title, type: transaction.type }),
    });

    // Fetch the full stages
    const stages = await tx
      .select()
      .from(transactionStages)
      .where(eq(transactionStages.transactionId, transaction.id))
      .orderBy(transactionStages.orderIndex);

    return { property, transaction, stages };
  });

  return json({ transaction, property, stages }, 201);
};

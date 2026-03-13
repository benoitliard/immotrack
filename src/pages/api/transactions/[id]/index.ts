import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '~/lib/db';
import { transactions, properties, transactionStages, transactionParticipants } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '~/lib/activity';
import { json, error } from '~/lib/api-response';

// GET /api/transactions/[id] — get transaction detail
export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return error('Non autorisé', 401);
  }

  const { id } = params;

  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id!));

  if (!tx) {
    return error('Transaction introuvable', 404);
  }

  // Check access: owner or admin always allowed; otherwise check participation
  const isOwner = tx.brokerId === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const [participation] = await db
      .select()
      .from(transactionParticipants)
      .where(
        and(
          eq(transactionParticipants.transactionId, id!),
          eq(transactionParticipants.userId, user.id)
        )
      );

    if (!participation) {
      return error('Accès refusé', 403);
    }
  }

  const [property, stages, participants] = await Promise.all([
    tx.propertyId
      ? db.select().from(properties).where(eq(properties.id, tx.propertyId)).then(r => r[0] ?? null)
      : Promise.resolve(null),
    db.select().from(transactionStages).where(eq(transactionStages.transactionId, tx.id)).orderBy(transactionStages.orderIndex),
    db.select().from(transactionParticipants).where(eq(transactionParticipants.transactionId, tx.id)),
  ]);

  return json({ transaction: tx, property, stages, participants });
};

const UpdateTransactionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'on_hold']).optional(),
  closing_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  actual_price: z.number().int().min(0).nullable().optional(),
});

// PUT /api/transactions/[id] — update transaction (broker only)
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorisé', 401);
  }

  const { id } = params;

  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      user.role === 'admin'
        ? eq(transactions.id, id!)
        : and(eq(transactions.id, id!), eq(transactions.brokerId, user.id))
    );

  if (!tx) {
    return error('Transaction introuvable ou accès refusé', 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Corps de requête invalide', 400);
  }

  const parsed = UpdateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Données invalides', details: parsed.error.errors }, 422);
  }

  const data = parsed.data;
  const updateValues: Partial<typeof tx> = { updatedAt: new Date() };

  if (data.title !== undefined) updateValues.title = data.title;
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.closing_date !== undefined) updateValues.closingDate = data.closing_date ? new Date(data.closing_date) : null;
  if (data.notes !== undefined) updateValues.notes = data.notes ?? null;
  if (data.actual_price !== undefined) updateValues.actualPrice = data.actual_price ?? null;

  const [updated] = await db
    .update(transactions)
    .set(updateValues)
    .where(eq(transactions.id, id!))
    .returning();

  await logActivity(id!, user.id, 'Transaction mise à jour', { changes: Object.keys(data) });

  return json({ transaction: updated });
};

// DELETE /api/transactions/[id] — cancel transaction (broker only)
export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return error('Non autorisé', 401);
  }

  const { id } = params;

  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      user.role === 'admin'
        ? eq(transactions.id, id!)
        : and(eq(transactions.id, id!), eq(transactions.brokerId, user.id))
    );

  if (!tx) {
    return error('Transaction introuvable ou accès refusé', 404);
  }

  const [cancelled] = await db
    .update(transactions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(transactions.id, id!))
    .returning();

  await logActivity(id!, user.id, 'Transaction annulée');

  return json({ transaction: cancelled });
};

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '~/lib/db';
import { transactions, transactionStages, transactionParticipants } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { advanceStage } from '~/lib/stages';
import { logActivity } from '~/lib/activity';
import { notifyParticipants } from '~/lib/notifications';

const StageActionSchema = z.object({
  action: z.enum(['advance', 'skip', 'revert']),
  stageOrder: z.number().int().min(1),
});

// PUT /api/transactions/[id]/stages — advance, skip, or revert a stage
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user as (typeof locals.user & { role?: string }) | null;
  if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });
  }

  const { id } = params;

  // Verify broker owns this transaction
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      user.role === 'admin'
        ? eq(transactions.id, id!)
        : and(eq(transactions.id, id!), eq(transactions.brokerId, user.id))
    );

  if (!tx) {
    return new Response(JSON.stringify({ error: 'Transaction introuvable ou accès refusé' }), { status: 404 });
  }

  if (tx.status === 'cancelled' || tx.status === 'completed') {
    return new Response(JSON.stringify({ error: 'Impossible de modifier les étapes d\'une transaction terminée.' }), { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), { status: 400 });
  }

  const parsed = StageActionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Données invalides', details: parsed.error.errors }), { status: 422 });
  }

  const { action, stageOrder } = parsed.data;

  // Fetch the target stage
  const [targetStage] = await db
    .select()
    .from(transactionStages)
    .where(
      and(
        eq(transactionStages.transactionId, id!),
        eq(transactionStages.orderIndex, stageOrder)
      )
    );

  if (!targetStage) {
    return new Response(JSON.stringify({ error: 'Étape introuvable' }), { status: 404 });
  }

  let result: typeof targetStage | null = null;
  let activityMessage = '';

  if (action === 'advance') {
    // Check there is a next stage
    const [nextStage] = await db
      .select()
      .from(transactionStages)
      .where(
        and(
          eq(transactionStages.transactionId, id!),
          eq(transactionStages.orderIndex, stageOrder + 1)
        )
      );

    if (!nextStage) {
      // No next stage — mark transaction as completed
      await db
        .update(transactionStages)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(transactionStages.id, targetStage.id));

      await db
        .update(transactions)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(transactions.id, id!));

      activityMessage = `Transaction complétée — dernière étape "${targetStage.name}" terminée`;
    } else {
      result = await advanceStage(id!, stageOrder) ?? null;
      activityMessage = `Étape "${targetStage.name}" complétée — passage à "${nextStage.name}"`;
    }
  } else if (action === 'skip') {
    await db
      .update(transactionStages)
      .set({ status: 'skipped' })
      .where(eq(transactionStages.id, targetStage.id));

    activityMessage = `Étape "${targetStage.name}" ignorée`;
  } else if (action === 'revert') {
    await db
      .update(transactionStages)
      .set({ status: 'pending', completedAt: null })
      .where(eq(transactionStages.id, targetStage.id));

    // Set previous to current if applicable
    if (stageOrder > 1) {
      await db
        .update(transactionStages)
        .set({ status: 'current' })
        .where(
          and(
            eq(transactionStages.transactionId, id!),
            eq(transactionStages.orderIndex, stageOrder - 1)
          )
        );

      await db
        .update(transactions)
        .set({ currentStageOrder: stageOrder - 1, updatedAt: new Date() })
        .where(eq(transactions.id, id!));
    }

    activityMessage = `Étape "${targetStage.name}" rétablie en attente`;
  }

  // Log activity
  await logActivity(id!, user.id, activityMessage, { action, stageOrder });

  // Notify participants
  await notifyParticipants(id!, user.id, {
    type: 'stage_change',
    title: 'Avancement de la transaction',
    message: activityMessage,
  });

  return new Response(
    JSON.stringify({ success: true, stage: result, message: activityMessage }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

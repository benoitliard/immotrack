import { db } from './db';
import { transactionStages, stageTemplates, transactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Create stages for a new transaction from templates
export async function createStagesFromTemplate(
  transactionId: string,
  transactionType: 'purchase' | 'sale' | 'rental'
) {
  const templates = await db
    .select()
    .from(stageTemplates)
    .where(eq(stageTemplates.transactionType, transactionType))
    .orderBy(stageTemplates.orderIndex);

  if (templates.length === 0) return [];

  const stages = templates.map((t, index) => ({
    transactionId,
    name: t.name,
    description: t.description,
    orderIndex: t.orderIndex,
    status: index === 0 ? ('current' as const) : ('pending' as const),
  }));

  return db.insert(transactionStages).values(stages).returning();
}

// Advance to next stage
export async function advanceStage(transactionId: string, currentOrder: number) {
  return db.transaction(async (tx) => {
    // Mark current as completed
    await tx
      .update(transactionStages)
      .set({ status: 'completed', completedAt: new Date() })
      .where(
        and(
          eq(transactionStages.transactionId, transactionId),
          eq(transactionStages.orderIndex, currentOrder)
        )
      );

    // Mark next as current
    const nextOrder = currentOrder + 1;
    const [nextStage] = await tx
      .update(transactionStages)
      .set({ status: 'current' })
      .where(
        and(
          eq(transactionStages.transactionId, transactionId),
          eq(transactionStages.orderIndex, nextOrder)
        )
      )
      .returning();

    // Update transaction currentStageOrder
    await tx
      .update(transactions)
      .set({ currentStageOrder: nextOrder, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));

    return nextStage;
  });
}

// Revert to previous stage
export async function revertStage(transactionId: string, currentOrder: number) {
  return db.transaction(async (tx) => {
    const prevOrder = currentOrder - 1;
    if (prevOrder < 1) return null;

    // Mark current stage back to pending
    await tx
      .update(transactionStages)
      .set({ status: 'pending' })
      .where(
        and(
          eq(transactionStages.transactionId, transactionId),
          eq(transactionStages.orderIndex, currentOrder)
        )
      );

    // Mark previous stage back to current (clear completedAt)
    const [prevStage] = await tx
      .update(transactionStages)
      .set({ status: 'current', completedAt: null })
      .where(
        and(
          eq(transactionStages.transactionId, transactionId),
          eq(transactionStages.orderIndex, prevOrder)
        )
      )
      .returning();

    // Update transaction currentStageOrder
    await tx
      .update(transactions)
      .set({ currentStageOrder: prevOrder, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));

    return prevStage;
  });
}

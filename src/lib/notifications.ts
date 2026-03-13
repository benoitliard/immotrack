import { db } from './db';
import { notifications } from '../db/schema';
import type { InferInsertModel } from 'drizzle-orm';

type NewNotification = Omit<InferInsertModel<typeof notifications>, 'id' | 'createdAt' | 'read'>;

export async function createNotification(data: NewNotification) {
  return db.insert(notifications).values(data).returning();
}

export async function notifyParticipants(
  transactionId: string,
  excludeUserId: string,
  notification: Omit<NewNotification, 'userId' | 'transactionId'>
) {
  // Import here to avoid circular deps
  const { transactionParticipants } = await import('../db/schema');
  const { eq, ne, and } = await import('drizzle-orm');

  const participants = await db
    .select()
    .from(transactionParticipants)
    .where(
      and(
        eq(transactionParticipants.transactionId, transactionId),
        ne(transactionParticipants.userId, excludeUserId)
      )
    );

  if (participants.length === 0) return [];

  const notifs = participants.map((p) => ({
    ...notification,
    userId: p.userId,
    transactionId,
  }));

  return db.insert(notifications).values(notifs).returning();
}

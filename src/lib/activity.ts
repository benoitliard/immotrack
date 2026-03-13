import { db } from './db';
import { activityLog } from '../db/schema';

export async function logActivity(
  transactionId: string,
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>
) {
  return db
    .insert(activityLog)
    .values({
      transactionId,
      userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .returning();
}

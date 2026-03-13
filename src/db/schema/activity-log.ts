import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { transactions } from './transactions';

export const activityLog = pgTable('activity_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id),
  action: text('action').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

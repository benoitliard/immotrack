import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { stageStatusEnum } from './enums';
import { transactions } from './transactions';

export const transactionStages = pgTable('transaction_stages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  status: stageStatusEnum('status').default('pending'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

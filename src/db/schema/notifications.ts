import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { notificationTypeEnum } from './enums';
import { user } from './auth';
import { transactions } from './transactions';

export const notifications = pgTable('notifications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  transactionId: text('transaction_id').references(() => transactions.id),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { messageTypeEnum } from './enums';
import { user } from './auth';
import { transactions } from './transactions';

export const messages = pgTable('messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').references(() => user.id),
  type: messageTypeEnum('type').default('text'),
  content: text('content').notNull(),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

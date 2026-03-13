import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { transactions } from './transactions';
import { transactionStages } from './transaction-stages';

export const documents = pgTable('documents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  stageId: text('stage_id').references(() => transactionStages.id),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

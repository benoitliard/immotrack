import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { transactionTypeEnum } from './enums';

export const stageTemplates = pgTable('stage_templates', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
});

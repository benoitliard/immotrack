import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { transactionTypeEnum, transactionStatusEnum } from './enums';
import { user } from './auth';
import { properties } from './properties';

export const transactions = pgTable('transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').default('active'),
  brokerId: text('broker_id')
    .notNull()
    .references(() => user.id),
  propertyId: text('property_id').references(() => properties.id),
  currentStageOrder: integer('current_stage_order').default(1),
  closingDate: timestamp('closing_date', { withTimezone: true }),
  actualPrice: integer('actual_price'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

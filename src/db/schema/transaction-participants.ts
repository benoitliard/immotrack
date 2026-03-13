import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { participantRoleEnum } from './enums';
import { user } from './auth';
import { transactions } from './transactions';

export const transactionParticipants = pgTable(
  'transaction_participants',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    role: participantRoleEnum('role').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.transactionId, table.userId)],
);

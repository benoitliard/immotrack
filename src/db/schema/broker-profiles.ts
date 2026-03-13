import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const brokerProfiles = pgTable('broker_profiles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id),
  licenseNumber: text('license_number').notNull(),
  agency: text('agency'),
  phone: text('phone'),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

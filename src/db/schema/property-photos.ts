import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { properties } from './properties';

export const propertyPhotos = pgTable('property_photos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(), // file path relative to uploads
  caption: text('caption'),
  orderIndex: integer('order_index').notNull().default(0),
  isCover: boolean('is_cover').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

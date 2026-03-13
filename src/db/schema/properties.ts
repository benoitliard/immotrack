import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const properties = pgTable('properties', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  address: text('address').notNull(),
  city: text('city').notNull(),
  province: text('province').default('QC'),
  postalCode: text('postal_code'),
  propertyType: text('property_type').notNull(),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  area: integer('area'),
  listingPrice: integer('listing_price'),
  mlsNumber: text('mls_number'),
  description: text('description'),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  // Centris-style rich listing fields
  yearBuilt: integer('year_built'),
  lotArea: integer('lot_area'), // square feet
  livingArea: integer('living_area'), // square feet
  floors: integer('floors'),
  parking: text('parking'), // e.g. 'Garage double', 'Stationnement extérieur'
  heating: text('heating'), // e.g. 'Chauffage central', 'Plinthes électriques'
  waterHeater: text('water_heater'), // e.g. 'Électrique 60 gallons'
  municipalTax: integer('municipal_tax'), // annual, in cents
  schoolTax: integer('school_tax'), // annual, in cents
  condoFees: integer('condo_fees'), // monthly, in cents (for condos)
  zoning: text('zoning'), // e.g. 'Résidentiel'
  lot: text('lot'), // cadastre lot number
  nearbyServices: text('nearby_services'), // JSON array as text: schools, transport, etc.
  features: text('features'), // JSON array as text: fireplace, pool, etc.
  descriptionLong: text('description_long'), // Rich text description
  virtualTourUrl: text('virtual_tour_url'),
});

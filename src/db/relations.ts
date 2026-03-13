import { relations } from 'drizzle-orm';
import { user, session, account } from './schema/auth';
import { brokerProfiles } from './schema/broker-profiles';
import { properties } from './schema/properties';
import { propertyPhotos } from './schema/property-photos';
import { transactions } from './schema/transactions';
import { transactionParticipants } from './schema/transaction-participants';
import { transactionStages } from './schema/transaction-stages';
import { messages } from './schema/messages';
import { documents } from './schema/documents';
import { activityLog } from './schema/activity-log';
import { notifications } from './schema/notifications';

export const userRelations = relations(user, ({ one, many }) => ({
  brokerProfile: one(brokerProfiles, {
    fields: [user.id],
    references: [brokerProfiles.userId],
  }),
  transactions: many(transactions),
  transactionParticipants: many(transactionParticipants),
  messages: many(messages),
  documents: many(documents),
  notifications: many(notifications),
  activityLog: many(activityLog),
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const brokerProfileRelations = relations(brokerProfiles, ({ one }) => ({
  user: one(user, {
    fields: [brokerProfiles.userId],
    references: [user.id],
  }),
}));

export const propertyRelations = relations(properties, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [properties.createdBy],
    references: [user.id],
  }),
  transactions: many(transactions),
  photos: many(propertyPhotos),
}));

export const propertyPhotoRelations = relations(propertyPhotos, ({ one }) => ({
  property: one(properties, {
    fields: [propertyPhotos.propertyId],
    references: [properties.id],
  }),
}));

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  broker: one(user, {
    fields: [transactions.brokerId],
    references: [user.id],
  }),
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
  stages: many(transactionStages),
  participants: many(transactionParticipants),
  messages: many(messages),
  documents: many(documents),
  activityLog: many(activityLog),
  notifications: many(notifications),
}));

export const transactionParticipantRelations = relations(
  transactionParticipants,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionParticipants.transactionId],
      references: [transactions.id],
    }),
    user: one(user, {
      fields: [transactionParticipants.userId],
      references: [user.id],
    }),
  }),
);

export const transactionStageRelations = relations(
  transactionStages,
  ({ one, many }) => ({
    transaction: one(transactions, {
      fields: [transactionStages.transactionId],
      references: [transactions.id],
    }),
    documents: many(documents),
  }),
);

export const messageRelations = relations(messages, ({ one }) => ({
  transaction: one(transactions, {
    fields: [messages.transactionId],
    references: [transactions.id],
  }),
  sender: one(user, {
    fields: [messages.senderId],
    references: [user.id],
  }),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  transaction: one(transactions, {
    fields: [documents.transactionId],
    references: [transactions.id],
  }),
  uploadedBy: one(user, {
    fields: [documents.uploadedBy],
    references: [user.id],
  }),
  stage: one(transactionStages, {
    fields: [documents.stageId],
    references: [transactionStages.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  transaction: one(transactions, {
    fields: [activityLog.transactionId],
    references: [transactions.id],
  }),
  user: one(user, {
    fields: [activityLog.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
  transaction: one(transactions, {
    fields: [notifications.transactionId],
    references: [transactions.id],
  }),
}));

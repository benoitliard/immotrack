import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['broker', 'client', 'admin']);

export const participantRoleEnum = pgEnum('participant_role', [
  'buyer',
  'seller',
  'notary',
  'inspector',
  'broker',
  'tenant',
  'landlord',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase',
  'sale',
  'rental',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'active',
  'completed',
  'cancelled',
  'on_hold',
]);

export const stageStatusEnum = pgEnum('stage_status', [
  'pending',
  'current',
  'completed',
  'skipped',
]);

export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'file',
  'system',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'stage_change',
  'new_message',
  'document_uploaded',
  'transaction_update',
  'invitation',
]);

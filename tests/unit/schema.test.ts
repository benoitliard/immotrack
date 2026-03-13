import { describe, it, expect } from 'vitest';

// We import the schema modules without connecting to a DB.
// Drizzle table definitions are plain objects — safe to import in Node.
import {
  userRoleEnum,
  participantRoleEnum,
  transactionTypeEnum,
  transactionStatusEnum,
  stageStatusEnum,
  messageTypeEnum,
  notificationTypeEnum,
} from '~/db/schema/enums';

import { user, session, account, verification } from '~/db/schema/auth';
import { brokerProfiles } from '~/db/schema/broker-profiles';
import { properties } from '~/db/schema/properties';
import { transactions } from '~/db/schema/transactions';
import { transactionParticipants } from '~/db/schema/transaction-participants';
import { transactionStages } from '~/db/schema/transaction-stages';
import { stageTemplates } from '~/db/schema/stage-templates';
import { activityLog } from '~/db/schema/activity-log';

// Helper: get the underlying enum values from a pgEnum
function enumValues(pgEnumObj: { enumValues: readonly string[] }): string[] {
  return [...pgEnumObj.enumValues];
}

// Helper: get column names from a drizzle pgTable
function columnNames(table: Record<string, unknown>): string[] {
  // Drizzle tables expose columns via their Symbol-keyed properties on `table`
  // but regular object keys work for the column name map built by pgTable.
  return Object.keys(table);
}

describe('Enum definitions', () => {
  it('userRoleEnum exports correctly', () => {
    expect(userRoleEnum).toBeDefined();
  });

  it('userRoleEnum contains broker, client, admin', () => {
    const values = enumValues(userRoleEnum);
    expect(values).toContain('broker');
    expect(values).toContain('client');
    expect(values).toContain('admin');
    expect(values).toHaveLength(3);
  });

  it('participantRoleEnum contains all participant roles', () => {
    const values = enumValues(participantRoleEnum);
    expect(values).toContain('buyer');
    expect(values).toContain('seller');
    expect(values).toContain('notary');
    expect(values).toContain('inspector');
    expect(values).toContain('broker');
    expect(values).toContain('tenant');
    expect(values).toContain('landlord');
    expect(values).toHaveLength(7);
  });

  it('transactionTypeEnum contains purchase, sale, rental', () => {
    const values = enumValues(transactionTypeEnum);
    expect(values).toContain('purchase');
    expect(values).toContain('sale');
    expect(values).toContain('rental');
    expect(values).toHaveLength(3);
  });

  it('transactionStatusEnum contains all status values', () => {
    const values = enumValues(transactionStatusEnum);
    expect(values).toContain('active');
    expect(values).toContain('completed');
    expect(values).toContain('cancelled');
    expect(values).toContain('on_hold');
    expect(values).toHaveLength(4);
  });

  it('stageStatusEnum contains pending, current, completed, skipped', () => {
    const values = enumValues(stageStatusEnum);
    expect(values).toContain('pending');
    expect(values).toContain('current');
    expect(values).toContain('completed');
    expect(values).toContain('skipped');
    expect(values).toHaveLength(4);
  });

  it('messageTypeEnum contains text, file, system', () => {
    const values = enumValues(messageTypeEnum);
    expect(values).toContain('text');
    expect(values).toContain('file');
    expect(values).toContain('system');
    expect(values).toHaveLength(3);
  });

  it('notificationTypeEnum contains all notification types', () => {
    const values = enumValues(notificationTypeEnum);
    expect(values).toContain('stage_change');
    expect(values).toContain('new_message');
    expect(values).toContain('document_uploaded');
    expect(values).toContain('transaction_update');
    expect(values).toContain('invitation');
    expect(values).toHaveLength(5);
  });
});

describe('Table exports', () => {
  it('user table exports correctly', () => {
    expect(user).toBeDefined();
  });

  it('session table exports correctly', () => {
    expect(session).toBeDefined();
  });

  it('account table exports correctly', () => {
    expect(account).toBeDefined();
  });

  it('verification table exports correctly', () => {
    expect(verification).toBeDefined();
  });

  it('brokerProfiles table exports correctly', () => {
    expect(brokerProfiles).toBeDefined();
  });

  it('properties table exports correctly', () => {
    expect(properties).toBeDefined();
  });

  it('transactions table exports correctly', () => {
    expect(transactions).toBeDefined();
  });

  it('transactionParticipants table exports correctly', () => {
    expect(transactionParticipants).toBeDefined();
  });

  it('transactionStages table exports correctly', () => {
    expect(transactionStages).toBeDefined();
  });

  it('stageTemplates table exports correctly', () => {
    expect(stageTemplates).toBeDefined();
  });

  it('activityLog table exports correctly', () => {
    expect(activityLog).toBeDefined();
  });
});

// Drizzle v0.45 stores the table name on Symbol(drizzle:Name), not on a plain `_` property.
function getTableName(table: object): string {
  const symbols = Object.getOwnPropertySymbols(table);
  for (const sym of symbols) {
    if (sym.toString() === 'Symbol(drizzle:Name)') {
      return (table as Record<symbol, unknown>)[sym] as string;
    }
  }
  throw new Error('Could not find drizzle:Name symbol on table');
}

describe('Table names', () => {
  it('user table is named "user"', () => {
    expect(getTableName(user)).toBe('user');
  });

  it('session table is named "session"', () => {
    expect(getTableName(session)).toBe('session');
  });

  it('transactions table is named "transactions"', () => {
    expect(getTableName(transactions)).toBe('transactions');
  });

  it('properties table is named "properties"', () => {
    expect(getTableName(properties)).toBe('properties');
  });

  it('broker_profiles table is named "broker_profiles"', () => {
    expect(getTableName(brokerProfiles)).toBe('broker_profiles');
  });

  it('transaction_participants table is named "transaction_participants"', () => {
    expect(getTableName(transactionParticipants)).toBe('transaction_participants');
  });

  it('transaction_stages table is named "transaction_stages"', () => {
    expect(getTableName(transactionStages)).toBe('transaction_stages');
  });

  it('stage_templates table is named "stage_templates"', () => {
    expect(getTableName(stageTemplates)).toBe('stage_templates');
  });

  it('activity_log table is named "activity_log"', () => {
    expect(getTableName(activityLog)).toBe('activity_log');
  });
});

describe('Required columns on key tables', () => {
  it('user table has id, name, email, role columns', () => {
    const cols = columnNames(user);
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('email');
    expect(cols).toContain('role');
  });

  it('transactions table has id, title, type, status, brokerId columns', () => {
    const cols = columnNames(transactions);
    expect(cols).toContain('id');
    expect(cols).toContain('title');
    expect(cols).toContain('type');
    expect(cols).toContain('status');
    expect(cols).toContain('brokerId');
  });

  it('properties table has id, address, city, propertyType columns', () => {
    const cols = columnNames(properties);
    expect(cols).toContain('id');
    expect(cols).toContain('address');
    expect(cols).toContain('city');
    expect(cols).toContain('propertyType');
  });

  it('transactionStages table has id, transactionId, name, orderIndex, status columns', () => {
    const cols = columnNames(transactionStages);
    expect(cols).toContain('id');
    expect(cols).toContain('transactionId');
    expect(cols).toContain('name');
    expect(cols).toContain('orderIndex');
    expect(cols).toContain('status');
  });

  it('stageTemplates table has id, transactionType, name, orderIndex columns', () => {
    const cols = columnNames(stageTemplates);
    expect(cols).toContain('id');
    expect(cols).toContain('transactionType');
    expect(cols).toContain('name');
    expect(cols).toContain('orderIndex');
  });

  it('activityLog table has id, transactionId, action, metadata columns', () => {
    const cols = columnNames(activityLog);
    expect(cols).toContain('id');
    expect(cols).toContain('transactionId');
    expect(cols).toContain('action');
    expect(cols).toContain('metadata');
  });

  it('brokerProfiles table has id, userId, licenseNumber columns', () => {
    const cols = columnNames(brokerProfiles);
    expect(cols).toContain('id');
    expect(cols).toContain('userId');
    expect(cols).toContain('licenseNumber');
  });
});

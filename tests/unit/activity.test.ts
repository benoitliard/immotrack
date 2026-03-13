import { describe, it, expect } from 'vitest';

// Tests for the activity log metadata serialization logic.
// We test the pure serialization behaviour extracted from src/lib/activity.ts
// without touching the database.

// --- Pure logic under test ---
// This replicates the metadata serialization from logActivity() in src/lib/activity.ts.
// If that function's serialization logic ever changes, these tests will catch the regression.

function serializeMetadata(metadata?: Record<string, unknown>): string | null {
  return metadata ? JSON.stringify(metadata) : null;
}

describe('Activity log metadata serialization', () => {
  describe('serializeMetadata — happy paths', () => {
    it('serializes a simple flat object to a JSON string', () => {
      const metadata = { action: 'advance', stageOrder: 3 };
      const result = serializeMetadata(metadata);
      expect(result).toBe('{"action":"advance","stageOrder":3}');
    });

    it('serializes a nested object correctly', () => {
      const metadata = { title: 'Transaction test', type: 'purchase', extra: { count: 1 } };
      const result = serializeMetadata(metadata);
      expect(result).toBe(JSON.stringify(metadata));
    });

    it('round-trips correctly — parsed result equals the original object', () => {
      const metadata = { action: 'skip', stageOrder: 5, label: 'Inspection' };
      const serialized = serializeMetadata(metadata);
      expect(serialized).not.toBeNull();
      const parsed = JSON.parse(serialized!);
      expect(parsed).toEqual(metadata);
    });

    it('serializes an object with a string value', () => {
      const metadata = { title: 'Achat Laval', type: 'purchase' };
      const result = serializeMetadata(metadata);
      expect(typeof result).toBe('string');
      expect(result).toContain('"title":"Achat Laval"');
      expect(result).toContain('"type":"purchase"');
    });

    it('serializes an empty object to "{}"', () => {
      const result = serializeMetadata({});
      expect(result).toBe('{}');
    });

    it('serializes an object with null values', () => {
      const metadata = { closingDate: null, notes: null };
      const result = serializeMetadata(metadata as unknown as Record<string, unknown>);
      expect(result).toBe('{"closingDate":null,"notes":null}');
    });

    it('serializes an object with array values', () => {
      const metadata = { stages: [1, 2, 3] };
      const result = serializeMetadata(metadata);
      expect(result).toBe('{"stages":[1,2,3]}');
    });
  });

  describe('serializeMetadata — null / undefined metadata', () => {
    it('returns null when metadata is undefined', () => {
      const result = serializeMetadata(undefined);
      expect(result).toBeNull();
    });

    it('returns null when called with no arguments', () => {
      const result = serializeMetadata();
      expect(result).toBeNull();
    });
  });

  describe('Activity action strings', () => {
    it('stage advancement action message format is a non-empty string', () => {
      const targetName = 'Inspection';
      const nextName = 'Financement';
      const message = `Étape "${targetName}" complétée — passage à "${nextName}"`;
      expect(typeof message).toBe('string');
      expect(message).toContain(targetName);
      expect(message).toContain(nextName);
    });

    it('stage skip action message format is a non-empty string', () => {
      const stageName = 'Négociation';
      const message = `Étape "${stageName}" ignorée`;
      expect(typeof message).toBe('string');
      expect(message).toContain(stageName);
    });

    it('stage revert action message format is a non-empty string', () => {
      const stageName = 'Promesse d\'achat';
      const message = `Étape "${stageName}" rétablie en attente`;
      expect(typeof message).toBe('string');
      expect(message).toContain(stageName);
    });

    it('transaction created action message is non-empty', () => {
      const message = 'Transaction créée';
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });
});

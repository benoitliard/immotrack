import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Zod schemas extracted from the API routes — tested in isolation without HTTP.

// From src/pages/api/transactions/index.ts
const CreateTransactionSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  type: z.enum(['purchase', 'sale', 'rental']),
  closing_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // Property fields
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, 'La ville est requise'),
  property_type: z.string().min(1, 'Le type de propriété est requis'),
  bedrooms: z.coerce.number().int().min(0).nullable().optional(),
  bathrooms: z.coerce.number().int().min(0).nullable().optional(),
  listing_price: z.coerce.number().int().min(0).nullable().optional(),
});

// From src/pages/api/transactions/[id]/stages.ts
const StageActionSchema = z.object({
  action: z.enum(['advance', 'skip', 'revert']),
  stageOrder: z.number().int().min(1),
});

// ─── CreateTransactionSchema ──────────────────────────────────────────────────

describe('CreateTransactionSchema', () => {
  const validPayload = {
    title: 'Achat Laval',
    type: 'purchase' as const,
    address: '123 rue des Érables',
    city: 'Laval',
    property_type: 'Maison unifamiliale',
  };

  describe('valid data', () => {
    it('accepts a minimal valid payload', () => {
      const result = CreateTransactionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('accepts a fully populated payload', () => {
      const result = CreateTransactionSchema.safeParse({
        ...validPayload,
        type: 'sale',
        closing_date: '2026-12-01',
        notes: 'Some notes',
        bedrooms: 3,
        bathrooms: 2,
        listing_price: 450000,
      });
      expect(result.success).toBe(true);
    });

    it('accepts type "sale"', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, type: 'sale' });
      expect(result.success).toBe(true);
    });

    it('accepts type "rental"', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, type: 'rental' });
      expect(result.success).toBe(true);
    });

    it('accepts null closing_date', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, closing_date: null });
      expect(result.success).toBe(true);
    });

    it('accepts omitted optional fields', () => {
      const result = CreateTransactionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.closing_date).toBeUndefined();
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('coerces string bedrooms to number', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, bedrooms: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bedrooms).toBe(3);
      }
    });

    it('coerces string listing_price to number', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, listing_price: '500000' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.listing_price).toBe(500000);
      }
    });
  });

  describe('invalid data — required fields', () => {
    it('rejects missing title', () => {
      const { title: _omit, ...payload } = validPayload;
      const result = CreateTransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty title', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, title: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 uses .issues instead of .errors
        expect(result.error.issues[0].message).toBe('Le titre est requis');
      }
    });

    it('rejects title exceeding 255 characters', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, title: 'A'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('rejects missing address', () => {
      const { address: _omit, ...payload } = validPayload;
      const result = CreateTransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty address', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, address: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing city', () => {
      const { city: _omit, ...payload } = validPayload;
      const result = CreateTransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty city', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, city: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing property_type', () => {
      const { property_type: _omit, ...payload } = validPayload;
      const result = CreateTransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('invalid data — type enum', () => {
    it('rejects invalid transaction type', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, type: 'lease' });
      expect(result.success).toBe(false);
    });

    it('rejects missing type', () => {
      const { type: _omit, ...payload } = validPayload;
      const result = CreateTransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects numeric type', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, type: 42 });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid data — numeric fields', () => {
    it('rejects negative bedrooms', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, bedrooms: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects negative bathrooms', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, bathrooms: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects negative listing_price', () => {
      const result = CreateTransactionSchema.safeParse({ ...validPayload, listing_price: -100 });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer bedrooms', () => {
      // z.coerce.number().int() will fail for floats
      const result = CreateTransactionSchema.safeParse({ ...validPayload, bedrooms: 2.5 });
      expect(result.success).toBe(false);
    });
  });
});

// ─── StageActionSchema ────────────────────────────────────────────────────────

describe('StageActionSchema', () => {
  describe('valid data', () => {
    it('accepts action "advance" with stageOrder 1', () => {
      const result = StageActionSchema.safeParse({ action: 'advance', stageOrder: 1 });
      expect(result.success).toBe(true);
    });

    it('accepts action "skip"', () => {
      const result = StageActionSchema.safeParse({ action: 'skip', stageOrder: 3 });
      expect(result.success).toBe(true);
    });

    it('accepts action "revert"', () => {
      const result = StageActionSchema.safeParse({ action: 'revert', stageOrder: 5 });
      expect(result.success).toBe(true);
    });

    it('accepts a large stageOrder', () => {
      const result = StageActionSchema.safeParse({ action: 'advance', stageOrder: 10 });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('rejects invalid action string', () => {
      const result = StageActionSchema.safeParse({ action: 'complete', stageOrder: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects missing action', () => {
      const result = StageActionSchema.safeParse({ stageOrder: 2 });
      expect(result.success).toBe(false);
    });

    it('rejects missing stageOrder', () => {
      const result = StageActionSchema.safeParse({ action: 'advance' });
      expect(result.success).toBe(false);
    });

    it('rejects stageOrder of 0 (must be min 1)', () => {
      const result = StageActionSchema.safeParse({ action: 'advance', stageOrder: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects negative stageOrder', () => {
      const result = StageActionSchema.safeParse({ action: 'skip', stageOrder: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects float stageOrder', () => {
      const result = StageActionSchema.safeParse({ action: 'advance', stageOrder: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects string stageOrder (no coercion on this schema)', () => {
      const result = StageActionSchema.safeParse({ action: 'advance', stageOrder: '2' });
      expect(result.success).toBe(false);
    });
  });
});

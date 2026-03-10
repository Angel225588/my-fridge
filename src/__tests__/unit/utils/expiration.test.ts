import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getExpirationStatus,
  getDaysUntilExpiration,
  getExpirationInfo,
  sortByExpiration,
  getDefaultExpirationDays,
} from '@/lib/utils/expiration';
import type { Product, ExpirationStatus } from '@/types';

describe('Expiration Utilities', () => {
  // Mock the current date for consistent testing
  const MOCK_NOW = new Date('2024-03-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDaysUntilExpiration', () => {
    it('returns positive days for future dates', () => {
      const futureDate = '2024-03-20'; // 5 days from now
      expect(getDaysUntilExpiration(futureDate)).toBe(5);
    });

    it('returns 0 for today', () => {
      const today = '2024-03-15';
      expect(getDaysUntilExpiration(today)).toBe(0);
    });

    it('returns negative days for past dates', () => {
      const pastDate = '2024-03-10'; // 5 days ago
      expect(getDaysUntilExpiration(pastDate)).toBe(-5);
    });

    it('returns null for null input', () => {
      expect(getDaysUntilExpiration(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(getDaysUntilExpiration(undefined)).toBeNull();
    });
  });

  describe('getExpirationStatus', () => {
    it('returns "fresh" for 7+ days until expiration', () => {
      expect(getExpirationStatus(7)).toBe('fresh');
      expect(getExpirationStatus(10)).toBe('fresh');
      expect(getExpirationStatus(100)).toBe('fresh');
    });

    it('returns "warning" for 3-6 days until expiration', () => {
      expect(getExpirationStatus(3)).toBe('warning');
      expect(getExpirationStatus(4)).toBe('warning');
      expect(getExpirationStatus(5)).toBe('warning');
      expect(getExpirationStatus(6)).toBe('warning');
    });

    it('returns "urgent" for 0-2 days until expiration', () => {
      expect(getExpirationStatus(0)).toBe('urgent');
      expect(getExpirationStatus(1)).toBe('urgent');
      expect(getExpirationStatus(2)).toBe('urgent');
    });

    it('returns "expired" for negative days', () => {
      expect(getExpirationStatus(-1)).toBe('expired');
      expect(getExpirationStatus(-10)).toBe('expired');
    });

    it('returns "no-date" for null', () => {
      expect(getExpirationStatus(null)).toBe('no-date');
    });
  });

  describe('getExpirationInfo', () => {
    it('returns correct info for fresh products', () => {
      const info = getExpirationInfo('2024-03-25'); // 10 days
      expect(info.status).toBe('fresh');
      expect(info.daysUntilExpiration).toBe(10);
      expect(info.label).toBe('10j restants');
    });

    it('returns correct info for warning products', () => {
      const info = getExpirationInfo('2024-03-19'); // 4 days
      expect(info.status).toBe('warning');
      expect(info.daysUntilExpiration).toBe(4);
      expect(info.label).toBe('4j restants');
    });

    it('returns correct info for urgent products', () => {
      const info = getExpirationInfo('2024-03-16'); // 1 day
      expect(info.status).toBe('urgent');
      expect(info.daysUntilExpiration).toBe(1);
      expect(info.label).toBe('1 jour restant');
    });

    it('returns "Expire aujourd\'hui" for 0 days', () => {
      const info = getExpirationInfo('2024-03-15'); // today
      expect(info.status).toBe('urgent');
      expect(info.label).toBe('Expire aujourd\'hui');
    });

    it('returns correct info for expired products', () => {
      const info = getExpirationInfo('2024-03-12'); // 3 days ago
      expect(info.status).toBe('expired');
      expect(info.daysUntilExpiration).toBe(-3);
      expect(info.label).toBe('Expiré il y a 3j');
    });

    it('returns "Expiré hier" for 1 day ago', () => {
      const info = getExpirationInfo('2024-03-14');
      expect(info.label).toBe('Expiré hier');
    });

    it('returns correct info for no date', () => {
      const info = getExpirationInfo(null);
      expect(info.status).toBe('no-date');
      expect(info.daysUntilExpiration).toBeNull();
      expect(info.label).toBe('Exp ?');
    });
  });

  describe('sortByExpiration', () => {
    const createProduct = (id: string, expirationDate: string | null): Product => ({
      id,
      fridge_id: 'fridge-1',
      name: `Product ${id}`,
      quantity: 1,
      unit: 'pcs',
      category: 'other',
      expiration_date: expirationDate,
      purchase_date: '2024-03-01',
      added_by: 'user-1',
      location: 'fridge',
      created_at: '2024-03-01',
      updated_at: '2024-03-01',
    });

    it('sorts products by expiration date ascending (soonest first)', () => {
      const products: Product[] = [
        createProduct('3', '2024-03-25'),
        createProduct('1', '2024-03-16'),
        createProduct('2', '2024-03-20'),
      ];

      const sorted = sortByExpiration(products);
      expect(sorted.map(p => p.id)).toEqual(['1', '2', '3']);
    });

    it('puts expired products at the top', () => {
      const products: Product[] = [
        createProduct('2', '2024-03-20'),
        createProduct('1', '2024-03-10'), // expired
        createProduct('3', '2024-03-25'),
      ];

      const sorted = sortByExpiration(products);
      expect(sorted[0].id).toBe('1');
    });

    it('puts products without expiration date at the end', () => {
      const products: Product[] = [
        createProduct('2', null),
        createProduct('1', '2024-03-16'),
        createProduct('3', '2024-03-25'),
      ];

      const sorted = sortByExpiration(products);
      expect(sorted.map(p => p.id)).toEqual(['1', '3', '2']);
    });

    it('handles empty array', () => {
      expect(sortByExpiration([])).toEqual([]);
    });
  });

  describe('getDefaultExpirationDays', () => {
    it('returns correct defaults for each category', () => {
      expect(getDefaultExpirationDays('dairy')).toBe(10);
      expect(getDefaultExpirationDays('meat')).toBe(5);
      expect(getDefaultExpirationDays('produce')).toBe(7);
      expect(getDefaultExpirationDays('beverages')).toBe(30);
      expect(getDefaultExpirationDays('grains')).toBe(180);
      expect(getDefaultExpirationDays('frozen')).toBe(90);
      expect(getDefaultExpirationDays('condiments')).toBe(180);
      expect(getDefaultExpirationDays('snacks')).toBe(30);
      expect(getDefaultExpirationDays('other')).toBe(14);
    });
  });
});

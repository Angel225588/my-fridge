import { describe, it, expect } from 'vitest';
import {
  generateInviteCode,
  isValidInviteCode,
  INVITE_CODE_LENGTH,
  INVITE_CODE_CHARS,
} from '@/lib/utils/inviteCode';

describe('Invite Code Utilities', () => {
  describe('generateInviteCode', () => {
    it('generates a code of correct length', () => {
      const code = generateInviteCode();
      expect(code.length).toBe(INVITE_CODE_LENGTH);
    });

    it('generates uppercase alphanumeric codes only', () => {
      const code = generateInviteCode();
      const validChars = new RegExp(`^[${INVITE_CODE_CHARS}]+$`);
      expect(code).toMatch(validChars);
    });

    it('generates unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }
      // With 6 chars from 36 options, collision in 100 is extremely unlikely
      expect(codes.size).toBe(100);
    });

    it('generates codes without ambiguous characters', () => {
      // O, 0, I, 1, L could be ambiguous - checking they're excluded
      const codes: string[] = [];
      for (let i = 0; i < 50; i++) {
        codes.push(generateInviteCode());
      }

      const allCodes = codes.join('');
      // If using a clean charset, these shouldn't appear
      expect(allCodes).not.toContain('O');
      expect(allCodes).not.toContain('I');
      expect(allCodes).not.toContain('L');
    });
  });

  describe('isValidInviteCode', () => {
    it('returns true for valid codes', () => {
      expect(isValidInviteCode('ABC123')).toBe(true);
      expect(isValidInviteCode('XYZA99')).toBe(true);
      expect(isValidInviteCode('123456')).toBe(true);
    });

    it('returns false for codes that are too short', () => {
      expect(isValidInviteCode('ABC12')).toBe(false);
      expect(isValidInviteCode('AB')).toBe(false);
      expect(isValidInviteCode('')).toBe(false);
    });

    it('returns false for codes that are too long', () => {
      expect(isValidInviteCode('ABC1234')).toBe(false);
      expect(isValidInviteCode('ABCDEFGHIJ')).toBe(false);
    });

    it('returns false for lowercase characters', () => {
      expect(isValidInviteCode('abc123')).toBe(false);
      expect(isValidInviteCode('AbC123')).toBe(false);
    });

    it('returns false for special characters', () => {
      expect(isValidInviteCode('ABC12!')).toBe(false);
      expect(isValidInviteCode('ABC-12')).toBe(false);
      expect(isValidInviteCode('ABC 12')).toBe(false);
    });

    it('handles null/undefined gracefully', () => {
      expect(isValidInviteCode(null as unknown as string)).toBe(false);
      expect(isValidInviteCode(undefined as unknown as string)).toBe(false);
    });
  });
});

/**
 * Invite Code Utilities
 * Generate and validate unique invite codes for fridge workspaces
 */

// Characters that are unambiguous (no O/0, I/1/L confusion)
export const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

/**
 * Generate a random invite code
 * @returns 6-character uppercase alphanumeric code
 */
export function generateInviteCode(): string {
  let code = '';
  const charsLength = INVITE_CODE_CHARS.length;

  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * charsLength);
    code += INVITE_CODE_CHARS[randomIndex];
  }

  return code;
}

/**
 * Validate an invite code format
 * @param code - The code to validate
 * @returns true if valid format, false otherwise
 */
export function isValidInviteCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== INVITE_CODE_LENGTH) return false;

  // Must only contain valid characters (uppercase alphanumeric)
  const validPattern = /^[A-Z0-9]+$/;
  return validPattern.test(code);
}

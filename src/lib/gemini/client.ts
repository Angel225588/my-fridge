import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not set - AI features will be disabled');
}

/**
 * Google Gemini AI client
 * Using Gemini 1.5 Flash for speed and free tier
 */
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Get the text model for command parsing
 */
export function getTextModel(): GenerativeModel | null {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

/**
 * Get the vision model for receipt parsing
 */
export function getVisionModel(): GenerativeModel | null {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return genAI !== null;
}

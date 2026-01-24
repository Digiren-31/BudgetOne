import * as Crypto from 'expo-crypto';

/**
 * Generate a UUID v4 using expo-crypto for reliable random generation
 * This ensures proper randomness on React Native / Expo
 */
export function generateUUID(): string {
  const randomBytes = Crypto.getRandomBytes(16);
  
  // Set version (4) and variant bits
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 1
  
  // Convert to hex string with dashes
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generate a short unique ID (8 characters) for display purposes
 */
export function generateShortId(): string {
  const randomBytes = Crypto.getRandomBytes(4);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

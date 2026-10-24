/**
 * App PIN security and rate-limiting using Web Crypto API (SHA-256)
 */

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}:koraish_traders_cement_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface PinValidationResult {
  success: boolean;
  isLocked: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds: number;
  errorMessageBn?: string;
}

export async function verifyAppPin(
  enteredPin: string,
  storedHash: string | null,
  storedSalt: string | null,
  currentFailedAttempts: number,
  lockoutUntil: number | null
): Promise<PinValidationResult> {
  const now = Date.now();

  // Check if currently locked out
  if (lockoutUntil && lockoutUntil > now) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return {
      success: false,
      isLocked: true,
      remainingAttempts: 0,
      lockoutRemainingSeconds: remainingSeconds,
      errorMessageBn: `অতিরিক্ত ভুল চেষ্টার কারণে অ্যাপ লক করা আছে। অনুগ্রহ করে ${remainingSeconds} সেকেন্ড অপেক্ষা করুন।`,
    };
  }

  // If no PIN set yet
  if (!storedHash || !storedSalt) {
    return {
      success: true,
      isLocked: false,
      remainingAttempts: MAX_PIN_ATTEMPTS,
      lockoutRemainingSeconds: 0,
    };
  }

  const computedHash = await hashPin(enteredPin, storedSalt);

  if (computedHash === storedHash) {
    return {
      success: true,
      isLocked: false,
      remainingAttempts: MAX_PIN_ATTEMPTS,
      lockoutRemainingSeconds: 0,
    };
  } else {
    const newFailed = currentFailedAttempts + 1;
    const isNowLocked = newFailed >= MAX_PIN_ATTEMPTS;
    const remaining = Math.max(0, MAX_PIN_ATTEMPTS - newFailed);
    const lockoutSec = isNowLocked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0;

    return {
      success: false,
      isLocked: isNowLocked,
      remainingAttempts: remaining,
      lockoutRemainingSeconds: lockoutSec,
      errorMessageBn: isNowLocked
        ? 'পরপর ৫ বার ভুল পিন দেওয়ার কারণে অ্যাপ ৫ মিনিটের জন্য লক করা হয়েছে।'
        : `ভুল পিন দিয়েছেন! আপনার আর ${remaining} বার চেষ্টা বাকি আছে।`,
    };
  }
}

import * as Crypto from 'expo-crypto';

const SALT_PREFIX = 'drinkguard_v2_';

export async function hashPin(pin: string): Promise<string> {
  const salted = SALT_PREFIX + pin;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salted
  );
  return hash;
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  // Try new salted hash first
  const newHash = await hashPin(pin);
  if (newHash === storedHash) return true;

  // Backwards-compat: check against legacy unsalted SHA-256
  try {
    const legacyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    if (legacyHash === storedHash) return true;
  } catch {
    // ignore
  }

  // Backwards-compat: check against old simpleHash for users who set PIN
  // when crypto.subtle was unavailable
  if (legacySimpleHash(pin) === storedHash) return true;

  return false;
}

function legacySimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16).padStart(8, '0') + str.length.toString(16);
}

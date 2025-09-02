// Generates a stable client fingerprint stored in localStorage.
// Uses Web Crypto to hash a set of semi-stable signals + a random seed.
// TODO: Look into ThumbmarkJS

const FP_KEY = 'ck_fingerprint_v1';

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(input: string) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

export async function getFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server';
  try {
    const stored = localStorage.getItem(FP_KEY);
    if (stored) return stored;
    const signals = [
      navigator.userAgent || '',
      navigator.language || '',
      String(Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
      String(screen?.width || ''),
      String(screen?.height || ''),
      String(screen?.pixelDepth || ''),
      String(screen?.colorDepth || ''),
      // random seed to de-duplicate per device/browser
      crypto.getRandomValues(new Uint32Array(4)).join('-'),
    ].join('|');
    const fp = await sha256(signals);
    localStorage.setItem(FP_KEY, fp);
    return fp;
  } catch {
    // Fallback to a random string if crypto/localStorage are unavailable
    const fallback = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(FP_KEY, fallback);
    } catch (_err) {
      // ignore storage errors
      void _err;
    }
    return fallback;
  }
}

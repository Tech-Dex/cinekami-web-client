// Generates a client fingerprint using ThumbmarkJS (open-source, no API call)
// Caches the result in localStorage and falls back to v1 if needed.

const FP_V2_KEY = 'ck_fingerprint_v2_thumbmark';

type ThumbmarkInstance = {
  get: () => Promise<{ thumbmark?: string; visitorId?: string } | undefined>;
};

type ThumbmarkModule = {
  Thumbmark?: new () => ThumbmarkInstance;
  default?: new () => ThumbmarkInstance;
};

export async function getFingerprintV2(): Promise<string> {
  if (typeof window === 'undefined') return 'server';

  try {
    const stored = localStorage.getItem(FP_V2_KEY);
    if (stored) return stored;

    // Dynamic import to ensure it only loads on the client
    const mod: ThumbmarkModule = await import('@thumbmarkjs/thumbmarkjs');
    const Ctor = mod.Thumbmark ?? mod.default;
    if (!Ctor) throw new Error('Thumbmark constructor not found');

    const t = new Ctor();
    const tm = await t.get();
    const id = tm?.visitorId || tm?.thumbmark;
    if (id) {
      localStorage.setItem(FP_V2_KEY, id);
      return id;
    }
  } catch (err) {
    // ignore and fall back to v1
    void err;
  }

  // Fallback to v1 util if thumbmark fails for any reason
  try {
    const { getFingerprint } = await import('./fingerprint');
    const v1 = await getFingerprint();
    localStorage.setItem(FP_V2_KEY, v1);
    return v1;
  } catch (err) {
    // Last resort random
    void err;
    const fallback = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem(FP_V2_KEY, fallback); } catch (e) { void e; }
    return fallback;
  }
}

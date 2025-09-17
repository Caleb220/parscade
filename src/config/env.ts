type RawEnv = Record<string, string | undefined>;

const unsafePatterns = [/placeholder/i, /changeme/i, /example/i, /^\s*$/];

const requireEnv = (raw: RawEnv, key: string): string => {
  const value = raw[key] ?? '';
  if (unsafePatterns.some((pattern) => pattern.test(value))) {
    throw new Error(`Environment variable ${key} is not set to a secure value.`);
  }
  return value;
};

const optionalEnv = (raw: RawEnv, key: string): string | undefined => {
  const value = raw[key];
  if (!value || unsafePatterns.some((pattern) => pattern.test(value))) {
    return undefined;
  }
  return value;
};

const assertHttpsUrl = (value: string, name: string): string => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      throw new Error(`Environment variable ${name} must use https.`);
    }
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    throw new Error(`Environment variable ${name} must be a valid https URL.`);
  }
};

const rawEnv = (import.meta.env ?? {}) as RawEnv;

const supabaseUrl = assertHttpsUrl(requireEnv(rawEnv, 'VITE_SUPABASE_URL'), 'VITE_SUPABASE_URL');
const supabaseAnonKey = requireEnv(rawEnv, 'VITE_SUPABASE_ANON_KEY');

if (supabaseAnonKey.length < 20) {
  throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid.');
}

export const env = Object.freeze({
  mode: rawEnv.MODE ?? 'development',
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  },
  analytics: {
    key: optionalEnv(rawEnv, 'VITE_ANALYTICS_KEY'),
  },
});

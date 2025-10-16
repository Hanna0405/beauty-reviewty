import { assertNotProdOnDev } from './safety';

export type FirebaseRuntimeEnv = 'production' | 'preview' | 'development';

export const getRuntimeEnv = (): FirebaseRuntimeEnv => {
  const ve = process.env.VERCEL_ENV as FirebaseRuntimeEnv | undefined;
  if (ve === 'production' || ve === 'preview' || ve === 'development') return ve;
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

type FBConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const pick = (keys: string[]) => {
  const out: Record<string, string | undefined> = {};
  for (const k of keys) out[k] = process.env[k];
  return out;
};

const validateConfig = (cfg: Partial<FBConfig>, origin: string): FBConfig => {
  const missing = Object.entries({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `[Firebase config error from ${origin}] Missing envs for: ${missing.join(
        ', '
      )}. Check your .env / Vercel vars.`
    );
  }
  return cfg as FBConfig;
};

export const getFirebaseConfig = (): FBConfig => {
  const env = getRuntimeEnv();
  // prefer split keys
  const prefix = env === 'production' ? 'NEXT_PUBLIC_FIREBASE_*_PROD' : 'NEXT_PUBLIC_FIREBASE_*_DEV';
  const keys =
    env === 'production'
      ? {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PROD,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_PROD,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_PROD,
        }
      : {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_DEV,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_DEV,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_DEV,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_DEV,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_DEV,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_DEV,
        };

  // if split keys are missing (local setup), fallback to legacy single-set NEXT_PUBLIC_FIREBASE_* variables
  const needFallback = !keys.apiKey || !keys.projectId;
  const legacy = needFallback
    ? {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      }
    : undefined;

  const cfg = needFallback ? validateConfig(legacy || {}, 'legacy NEXT_PUBLIC_FIREBASE_*') : validateConfig(keys, prefix);
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info(`[Firebase] runtime env: ${env}, projectId: ${cfg.projectId}`);
  }
  // Prevent accidental writes from local to PROD
  assertNotProdOnDev(cfg.projectId);
  return cfg;
};

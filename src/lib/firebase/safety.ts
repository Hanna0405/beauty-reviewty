export const assertNotProdOnDev = (projectId?: string) => {
  const isDev = process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production';
  const prodProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD;
  if (isDev && projectId && prodProject && projectId === prodProject) {
    throw new Error(
      `Safety stop: Local/dev is pointing to PROD Firebase project (${projectId}). ` +
        `Put DEV keys into .env.local (NEXT_PUBLIC_FIREBASE_*_DEV and FIREBASE_ADMIN_*_DEV) or remove PROD keys from local env.`
    );
  }
};


import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

const { app, db, bucketName } = getFirebaseAdmin();

export const adminDb = db;
export const adminBucket = () => getStorage(app).bucket(bucketName);
export const ADMIN_BUCKET = bucketName;

'use client';
export { app, auth, db, storage } from '../firebase.client';

import { auth as _auth, db as _db, storage as _storage } from '../firebase.client';
export function requireAuth() { return _auth; }
export function requireDb() { return _db; }
export function requireStorage() { return _storage; }

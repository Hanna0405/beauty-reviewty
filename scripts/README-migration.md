# Booking Migration Script

## Overview
This script migrates existing booking documents to include the new `participants` array field required for the updated security rules.

## What it does
- Finds all booking documents without a `participants` array
- Adds `participants: [clientId, masterId]` based on existing fields
- Updates the `updatedAt` timestamp
- Skips documents that already have the participants array

## Usage

1. **Set environment variables** (same as your main app):
   ```bash
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_CLIENT_EMAIL="your-service-account-email"
   export FIREBASE_PRIVATE_KEY="your-private-key"
   ```

2. **Run the migration**:
   ```bash
   node scripts/migrate-bookings.js
   ```

## Safety
- The script is **safe to run multiple times**
- It only updates documents that don't already have the `participants` array
- Uses Firestore batch writes for efficiency
- Logs all operations for transparency

## After Migration
Once you've run this script, your existing bookings will be compatible with the new security rules and dashboard queries.

## Troubleshooting
- If you get permission errors, ensure your Firebase Admin SDK credentials are correct
- If some bookings are skipped, check the console logs for the reason
- The script will exit gracefully on completion or error

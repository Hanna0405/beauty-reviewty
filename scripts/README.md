# Scripts

This directory contains utility scripts for the Beauty Masters application.

## Seeding Script

### `seedListings.ts`

Populates the Firestore database with demo listings for testing and development.

#### Features

- **Safety Protection**: Requires `ALLOW_SEED=true` environment variable
- **Demo Data**: Creates 5 realistic listings across different cities and services
- **Comprehensive Coverage**: Includes various languages, services, and price ranges
- **Proper Timestamps**: Uses Firestore `serverTimestamp()` for consistency

#### Demo Listings Created

1. **Professional Hair Styling** (Toronto)
   - Service: Hair styling
   - Language: English
   - Price: $50-150

2. **Luxury Nail Art Studio** (Bradford)
   - Service: Nail art
   - Languages: English, Ukrainian
   - Price: $30-80

3. **Eyelash Extensions Specialist** (Ottawa)
   - Service: Lash extensions
   - Languages: English, Russian
   - Price: $80-200

4. **Complete Beauty Services** (Toronto)
   - Services: Hair, nails, lashes
   - Language: English
   - Price: $40-300

5. **Ukrainian Hair & Beauty** (Bradford)
   - Services: Hair, nails
   - Languages: Ukrainian, English
   - Price: $45-120

#### Usage

**Enable seeding and run:**
```bash
ALLOW_SEED=true npm run seed
```

**Without the flag (shows warning):**
```bash
npm run seed
```

#### Environment Variables Required

The script uses the same Firebase configuration as the main app:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Output

The script provides detailed logging:
- ✅ Success messages for each inserted listing
- 📊 Summary of total listings inserted
- 📍 Available cities and services
- 🌍 Available languages

#### Safety Notes

- Only runs when `ALLOW_SEED=true` is set
- Uses `seed-owner` as the owner ID for all demo listings
- All listings are marked as `isPublished: true`
- No photos are included (empty arrays)
- Location is set to `null` (no geolocation data)

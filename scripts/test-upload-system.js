// Test script to verify upload system is working
// Run with: node scripts/test-upload-system.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Upload System Setup');
console.log('==============================');

// Check if required files exist
const requiredFiles = [
  'src/lib/firebase-admin.ts',
  'src/app/api/upload/route.ts', 
  'src/lib/uploader.ts',
  'firestore.rules',
  'storage.rules'
];

console.log('\n📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check if components are using new uploader
console.log('\n🔧 Checking component imports:');
const componentsToCheck = [
  'src/components/ListingPhotos.tsx',
  'src/components/AvatarUploader.tsx'
];

componentsToCheck.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    const usesNewUploader = content.includes('uploadWithFallback');
    console.log(`${usesNewUploader ? '✅' : '❌'} ${component} - ${usesNewUploader ? 'Uses new uploader' : 'Needs update'}`);
  } else {
    console.log(`❌ ${component} - File not found`);
  }
});

// Check environment variables
console.log('\n🔑 Environment variables needed:');
const envVars = [
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'FIREBASE_PROJECT_ID', 
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET'
];

envVars.forEach(envVar => {
  console.log(`   ${envVar}`);
});

console.log('\n📋 Next steps:');
if (allFilesExist) {
  console.log('✅ All required files exist');
  console.log('1. Set environment variables in .env.local');
  console.log('2. Deploy security rules: firebase deploy --only firestore:rules,storage');
  console.log('3. Start dev server: npm run dev');
  console.log('4. Test creating a listing with photos');
  console.log('5. Check browser console for [BR] debug messages');
} else {
  console.log('❌ Some required files are missing');
  console.log('Please ensure all files are created before testing');
}

console.log('\n🎯 Expected behavior:');
console.log('- Uploads work via client SDK or fallback API');
console.log('- Listings save without permission errors');
console.log('- Debug logs show [BR] messages in console');
console.log('- Photos appear in Firebase Storage');

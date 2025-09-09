// Test script to verify server-side upload system
// Run with: node scripts/test-server-upload-system.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Server-Side Upload System');
console.log('====================================');

// Check if required files exist
const requiredFiles = [
  'src/lib/firebase-admin.ts',
  'src/app/api/upload/route.ts', 
  'src/lib/upload-image.ts',
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

// Check if components are using server-side uploads
console.log('\n🔧 Checking component upload methods:');
const componentsToCheck = [
  'src/components/ListingPhotos.tsx',
  'src/components/AvatarUploader.tsx',
  'src/app/dashboard/profile/edit/page.tsx',
  'src/app/dashboard/onboarding/page.tsx'
];

componentsToCheck.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    const usesServerUpload = content.includes('uploadImage');
    const hasClientUpload = content.includes('uploadBytesResumable') || content.includes('getDownloadURL');
    
    console.log(`${usesServerUpload ? '✅' : '❌'} ${component}`);
    console.log(`   ${usesServerUpload ? 'Uses server upload' : 'Needs server upload'}`);
    if (hasClientUpload) {
      console.log(`   ⚠️  Still has client upload code`);
    }
  } else {
    console.log(`❌ ${component} - File not found`);
  }
});

// Check for any remaining client upload usage
console.log('\n🔍 Checking for remaining client uploads:');
const searchPaths = ['src/app/dashboard', 'src/components'];
let hasClientUploads = false;

searchPaths.forEach(searchPath => {
  if (fs.existsSync(searchPath)) {
    const files = getAllFiles(searchPath);
    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('uploadBytesResumable') || content.includes('getDownloadURL')) {
          console.log(`⚠️  ${file} - Still has client upload code`);
          hasClientUploads = true;
        }
      }
    });
  }
});

if (!hasClientUploads) {
  console.log('✅ No client upload code found');
}

// Check environment variables
console.log('\n🔑 Environment variables needed:');
const envVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'
];

envVars.forEach(envVar => {
  console.log(`   ${envVar}`);
});

console.log('\n📋 Next steps:');
if (allFilesExist && !hasClientUploads) {
  console.log('✅ All required files exist and no client uploads remain');
  console.log('1. Set environment variables in .env.local');
  console.log('2. Deploy security rules: firebase deploy --only firestore:rules,storage');
  console.log('3. Start dev server: npm run dev');
  console.log('4. Test creating a listing with photos');
  console.log('5. Check browser network tab for POST /api/upload requests');
  console.log('6. Verify no CORS errors in console');
} else {
  console.log('❌ Some issues found');
  if (!allFilesExist) console.log('- Missing required files');
  if (hasClientUploads) console.log('- Client upload code still present');
}

console.log('\n🎯 Expected behavior:');
console.log('- All uploads go through POST /api/upload (no CORS)');
console.log('- Listings save without permission errors');
console.log('- Photos appear in Firebase Storage');
console.log('- No direct client SDK uploads to firebasestorage.googleapis.com');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

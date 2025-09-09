// Test script to verify upload diagnostics and error handling
// Run with: node scripts/test-upload-diagnostics.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Upload Diagnostics & Error Handling');
console.log('==============================================');

// Check if required files exist
const requiredFiles = [
  'src/app/api/upload/route.ts',
  'src/lib/upload-image.ts',
  'src/lib/firebase-admin.ts'
];

console.log('\n📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check API route diagnostics
console.log('\n🔧 Checking API route diagnostics:');
if (fs.existsSync('src/app/api/upload/route.ts')) {
  const apiContent = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');
  const hasEnvValidation = apiContent.includes('missingEnv()');
  const hasSizeGuard = apiContent.includes('File too large (>8MB)');
  const hasContentTypeCheck = apiContent.includes('multipart/form-data');
  const hasDetailedLogging = apiContent.includes('console.error("[/api/upload] FAIL:"');
  const hasSuccessLogging = apiContent.includes('console.info("[/api/upload] OK"');
  
  console.log(`${hasEnvValidation ? '✅' : '❌'} Has environment validation`);
  console.log(`${hasSizeGuard ? '✅' : '❌'} Has file size guard (8MB)`);
  console.log(`${hasContentTypeCheck ? '✅' : '❌'} Has content-type validation`);
  console.log(`${hasDetailedLogging ? '✅' : '❌'} Has detailed error logging`);
  console.log(`${hasSuccessLogging ? '✅' : '❌'} Has success logging with timing`);
}

// Check client helper error handling
console.log('\n📱 Checking client helper error handling:');
if (fs.existsSync('src/lib/upload-image.ts')) {
  const helperContent = fs.readFileSync('src/lib/upload-image.ts', 'utf8');
  const hasErrorParsing = helperContent.includes('await res.json()');
  const hasDetailedErrors = helperContent.includes('j?.error');
  const hasStatusCodes = helperContent.includes('res.status');
  
  console.log(`${hasErrorParsing ? '✅' : '❌'} Parses error responses from API`);
  console.log(`${hasDetailedErrors ? '✅' : '❌'} Extracts detailed error messages`);
  console.log(`${hasStatusCodes ? '✅' : '❌'} Includes HTTP status codes in errors`);
}

// Check debug logging in components
console.log('\n🔍 Checking debug logging in components:');
const componentsToCheck = [
  'src/components/ListingPhotos.tsx',
  'src/components/AvatarUploader.tsx',
  'src/components/MasterAvatarInput.tsx'
];

componentsToCheck.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    const hasDebugLogging = content.includes('console.info("[BR] will upload"');
    
    console.log(`${hasDebugLogging ? '✅' : '❌'} ${component} - Has debug logging`);
  } else {
    console.log(`❌ ${component} - File not found`);
  }
});

// Check environment variables
console.log('\n🔑 Environment variables needed:');
const envVars = [
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
  console.log('2. Restart dev server: npm run dev');
  console.log('3. Test uploading a small image (<1MB)');
  console.log('4. Test uploading a large image (>8MB) - should show "File too large"');
  console.log('5. Check browser console for [BR] debug messages');
  console.log('6. Check server logs for [/api/upload] messages');
} else {
  console.log('❌ Some required files are missing');
}

console.log('\n🎯 Expected behavior:');
console.log('- Small files: Upload succeeds with "[/api/upload] OK" in server logs');
console.log('- Large files: Shows "File too large (>8MB)" error in toast');
console.log('- Missing env: Shows "Missing env: FIREBASE_PRIVATE_KEY" error');
console.log('- Debug logs: Shows "[BR] will upload filename.jpg image/jpeg 123456" in console');
console.log('- Clear errors: No more generic "API upload failed: 500" messages');

console.log('\n🚨 Common issues to check:');
console.log('- FIREBASE_PRIVATE_KEY must have quotes and \\n for newlines');
console.log('- FIREBASE_STORAGE_BUCKET must match your actual bucket name');
console.log('- Service account must have Storage Admin permissions');
console.log('- Dev server must be restarted after .env.local changes');

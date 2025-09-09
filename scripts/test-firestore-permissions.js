// Test script to verify Firestore permissions fixes
// Run with: node scripts/test-firestore-permissions.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Firestore Permissions Fixes');
console.log('=====================================');

// Check if required files exist
const requiredFiles = [
  'firestore.rules',
  'src/lib/firestore-listings.ts',
  'src/lib/listen-my-listings.ts'
];

console.log('\n📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check Firestore rules content
console.log('\n🔒 Checking Firestore rules:');
if (fs.existsSync('firestore.rules')) {
  const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
  const hasOwnerUid = rulesContent.includes('ownerUid');
  const hasCreateRule = rulesContent.includes('allow create: if request.auth != null &&');
  const hasReadRule = rulesContent.includes('allow read: if resource != null &&');
  
  console.log(`${hasOwnerUid ? '✅' : '❌'} Uses ownerUid field`);
  console.log(`${hasCreateRule ? '✅' : '❌'} Has proper create rule`);
  console.log(`${hasReadRule ? '✅' : '❌'} Has proper read rule`);
}

// Check listing helpers
console.log('\n🔧 Checking listing helpers:');
if (fs.existsSync('src/lib/firestore-listings.ts')) {
  const helpersContent = fs.readFileSync('src/lib/firestore-listings.ts', 'utf8');
  const hasCreateListing = helpersContent.includes('export async function createListing');
  const hasUpdateListing = helpersContent.includes('export async function updateListing');
  const hasDeleteListing = helpersContent.includes('export async function deleteListingCascade');
  const setsOwnerUid = helpersContent.includes('ownerUid: userUid');
  
  console.log(`${hasCreateListing ? '✅' : '❌'} Has createListing function`);
  console.log(`${hasUpdateListing ? '✅' : '❌'} Has updateListing function`);
  console.log(`${hasDeleteListing ? '✅' : '❌'} Has deleteListingCascade function`);
  console.log(`${setsOwnerUid ? '✅' : '❌'} Sets ownerUid field`);
}

// Check My Listings query
console.log('\n📋 Checking My Listings query:');
if (fs.existsSync('src/lib/listen-my-listings.ts')) {
  const queryContent = fs.readFileSync('src/lib/listen-my-listings.ts', 'utf8');
  const usesOwnerUid = queryContent.includes('where("ownerUid","==",uid)');
  const hasNoOwnerId = !queryContent.includes('where("ownerId","==",uid)');
  
  console.log(`${usesOwnerUid ? '✅' : '❌'} Uses ownerUid in queries`);
  console.log(`${hasNoOwnerId ? '✅' : '❌'} No old ownerId queries`);
}

// Check listing pages
console.log('\n📄 Checking listing pages:');
const listingPages = [
  'src/app/dashboard/master/listings/new/page.tsx',
  'src/app/dashboard/master/listings/[id]/edit/page.tsx'
];

listingPages.forEach(page => {
  if (fs.existsSync(page)) {
    const content = fs.readFileSync(page, 'utf8');
    const usesHelper = content.includes('createListing') || content.includes('updateListing');
    const importsHelper = content.includes('from "@/lib/firestore-listings"');
    
    console.log(`${usesHelper ? '✅' : '❌'} ${page} - Uses helper functions`);
    console.log(`${importsHelper ? '✅' : '❌'} ${page} - Imports helpers`);
  } else {
    console.log(`❌ ${page} - File not found`);
  }
});

// Check for any remaining ownerId references
console.log('\n🔍 Checking for remaining ownerId references:');
const searchPaths = ['src/app/dashboard', 'src/lib'];
let hasOwnerIdRefs = false;

searchPaths.forEach(searchPath => {
  if (fs.existsSync(searchPath)) {
    const files = getAllFiles(searchPath);
    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('ownerId') && !content.includes('ownerUid')) {
          console.log(`⚠️  ${file} - Still has ownerId references`);
          hasOwnerIdRefs = true;
        }
      }
    });
  }
});

if (!hasOwnerIdRefs) {
  console.log('✅ No ownerId references found');
}

console.log('\n📋 Next steps:');
if (allFilesExist) {
  console.log('✅ All required files exist');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Sign in to your app');
  console.log('3. Test creating a new listing');
  console.log('4. Test editing an existing listing');
  console.log('5. Check "My Listings" page loads without permission errors');
  console.log('6. Verify listings save with ownerUid, status, timestamps');
} else {
  console.log('❌ Some required files are missing');
}

console.log('\n🎯 Expected behavior:');
console.log('- "My Listings" loads without "insufficient permissions" errors');
console.log('- Creating new listing succeeds with ownerUid field');
console.log('- Editing existing listing preserves ownerUid field');
console.log('- All listings have status, createdAt, updatedAt fields');
console.log('- Public pages can read published listings only');

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

#!/usr/bin/env bash
set -e

echo "🚀 Deploying Firebase Security Rules"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase CLI."
    echo "Please run: firebase login"
    exit 1
fi

echo "📋 Current Firebase project:"
firebase use

echo ""
echo "🔒 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo ""
echo "🗄️ Deploying Storage rules..."
firebase deploy --only storage

echo ""
echo "✅ Security rules deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Test creating a new listing"
echo "2. Test uploading photos/avatars"
echo "3. Verify no permission errors in console"
echo "4. Check Firebase Console → Firestore & Storage for new data"

#!/bin/bash

# Firebase Storage CORS Setup Script
# This script helps you apply CORS configuration to your Firebase Storage bucket

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Firebase Storage CORS Setup${NC}"
echo "=================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if CORS file exists
if [ ! -f "scripts/storage-cors.json" ]; then
    echo -e "${RED}❌ CORS configuration file not found at scripts/storage-cors.json${NC}"
    exit 1
fi

# Get project ID
echo -e "${YELLOW}📋 Current Google Cloud project:${NC}"
gcloud config get-value project

# Get bucket name from environment or prompt
if [ -f ".env.local" ]; then
    BUCKET_NAME=$(grep "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" .env.local | cut -d '=' -f2 | tr -d '"')
fi

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${YELLOW}📝 Please enter your Firebase Storage bucket name:${NC}"
    echo "   (Usually: <project-id>.appspot.com)"
    read -p "Bucket name: " BUCKET_NAME
fi

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}❌ Bucket name is required${NC}"
    exit 1
fi

echo -e "${YELLOW}🪣 Using bucket: ${BUCKET_NAME}${NC}"

# Check if bucket exists
echo -e "${YELLOW}🔍 Checking if bucket exists...${NC}"
if ! gcloud storage buckets describe gs://$BUCKET_NAME &> /dev/null; then
    echo -e "${RED}❌ Bucket gs://$BUCKET_NAME not found or not accessible${NC}"
    echo "Please check:"
    echo "1. Bucket name is correct"
    echo "2. You have Storage Admin permissions"
    echo "3. Project ID is correct"
    exit 1
fi

echo -e "${GREEN}✅ Bucket found${NC}"

# Apply CORS configuration
echo -e "${YELLOW}⚙️  Applying CORS configuration...${NC}"
if gcloud storage buckets update gs://$BUCKET_NAME --cors-file=scripts/storage-cors.json; then
    echo -e "${GREEN}✅ CORS configuration applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to apply CORS configuration${NC}"
    exit 1
fi

# Verify CORS configuration
echo -e "${YELLOW}🔍 Verifying CORS configuration...${NC}"
gcloud storage buckets describe gs://$BUCKET_NAME --format="default(cors)"

echo ""
echo -e "${GREEN}🎉 CORS setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Clear browser cache if needed"
echo "3. Test file uploads from http://localhost:3000"
echo "4. Check DevTools Network tab for CORS errors"
echo ""
echo -e "${YELLOW}🔧 If you still see CORS errors:${NC}"
echo "1. Verify Firebase Auth → Authorized domains include localhost"
echo "2. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env matches exactly"
echo "3. Try incognito/private browsing mode"
echo "4. Disable adblockers and VPNs"

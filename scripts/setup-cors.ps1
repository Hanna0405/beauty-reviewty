# Firebase Storage CORS Setup Script (PowerShell)
# This script helps you apply CORS configuration to your Firebase Storage bucket

param(
    [string]$BucketName = ""
)

Write-Host "🚀 Firebase Storage CORS Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ Google Cloud CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if CORS file exists
if (-not (Test-Path "scripts/storage-cors.json")) {
    Write-Host "❌ CORS configuration file not found at scripts/storage-cors.json" -ForegroundColor Red
    exit 1
}

# Get project ID
Write-Host "📋 Current Google Cloud project:" -ForegroundColor Yellow
gcloud config get-value project

# Get bucket name from environment or parameter
if (-not $BucketName) {
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local"
        $bucketLine = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" }
        if ($bucketLine) {
            $BucketName = ($bucketLine -split "=")[1].Trim('"')
        }
    }
}

if (-not $BucketName) {
    Write-Host "📝 Please enter your Firebase Storage bucket name:" -ForegroundColor Yellow
    Write-Host "   (Usually: <project-id>.appspot.com)" -ForegroundColor Yellow
    $BucketName = Read-Host "Bucket name"
}

if (-not $BucketName) {
    Write-Host "❌ Bucket name is required" -ForegroundColor Red
    exit 1
}

Write-Host "🪣 Using bucket: $BucketName" -ForegroundColor Yellow

# Check if bucket exists
Write-Host "🔍 Checking if bucket exists..." -ForegroundColor Yellow
try {
    gcloud storage buckets describe "gs://$BucketName" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Bucket not found"
    }
    Write-Host "✅ Bucket found" -ForegroundColor Green
} catch {
    Write-Host "❌ Bucket gs://$BucketName not found or not accessible" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Bucket name is correct" -ForegroundColor Yellow
    Write-Host "2. You have Storage Admin permissions" -ForegroundColor Yellow
    Write-Host "3. Project ID is correct" -ForegroundColor Yellow
    exit 1
}

# Apply CORS configuration
Write-Host "⚙️  Applying CORS configuration..." -ForegroundColor Yellow
try {
    gcloud storage buckets update "gs://$BucketName" --cors-file=scripts/storage-cors.json
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CORS configuration applied successfully" -ForegroundColor Green
    } else {
        throw "Failed to apply CORS"
    }
} catch {
    Write-Host "❌ Failed to apply CORS configuration" -ForegroundColor Red
    exit 1
}

# Verify CORS configuration
Write-Host "🔍 Verifying CORS configuration..." -ForegroundColor Yellow
gcloud storage buckets describe "gs://$BucketName" --format="default(cors)"

Write-Host ""
Write-Host "🎉 CORS setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor Yellow
Write-Host "2. Clear browser cache if needed" -ForegroundColor Yellow
Write-Host "3. Test file uploads from http://localhost:3000" -ForegroundColor Yellow
Write-Host "4. Check DevTools Network tab for CORS errors" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 If you still see CORS errors:" -ForegroundColor Yellow
Write-Host "1. Verify Firebase Auth → Authorized domains include localhost" -ForegroundColor Yellow
Write-Host "2. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env matches exactly" -ForegroundColor Yellow
Write-Host "3. Try incognito/private browsing mode" -ForegroundColor Yellow
Write-Host "4. Disable adblockers and VPNs" -ForegroundColor Yellow

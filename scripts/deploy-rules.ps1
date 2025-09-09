# Firebase Security Rules Deployment Script (PowerShell)
param(
    [switch]$SkipLogin
)

Write-Host "🚀 Deploying Firebase Security Rules" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    $null = Get-Command firebase -ErrorAction Stop
} catch {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in (unless skipped)
if (-not $SkipLogin) {
    try {
        firebase projects:list 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Not logged in"
        }
    } catch {
        Write-Host "❌ Not logged in to Firebase CLI." -ForegroundColor Red
        Write-Host "Please run: firebase login" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📋 Current Firebase project:" -ForegroundColor Yellow
firebase use

Write-Host ""
Write-Host "🔒 Deploying Firestore rules..." -ForegroundColor Yellow
try {
    firebase deploy --only firestore:rules
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
    } else {
        throw "Firestore deployment failed"
    }
} catch {
    Write-Host "❌ Failed to deploy Firestore rules" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️ Deploying Storage rules..." -ForegroundColor Yellow
try {
    firebase deploy --only storage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Storage rules deployed successfully!" -ForegroundColor Green
    } else {
        throw "Storage deployment failed"
    }
} catch {
    Write-Host "❌ Failed to deploy Storage rules" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 All security rules deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test creating a new listing" -ForegroundColor Yellow
Write-Host "2. Test uploading photos/avatars" -ForegroundColor Yellow
Write-Host "3. Verify no permission errors in console" -ForegroundColor Yellow
Write-Host "4. Check Firebase Console → Firestore & Storage for new data" -ForegroundColor Yellow

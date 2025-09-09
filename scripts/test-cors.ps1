# Firebase Storage CORS Test Script (PowerShell)
param(
    [Parameter(Mandatory=$true)]
    [string]$Bucket,
    
    [Parameter(Mandatory=$true)]
    [string]$Path
)

# URL encode the path
$EncodedPath = [System.Web.HttpUtility]::UrlEncode($Path)

# Construct the test URL
$Url = "https://firebasestorage.googleapis.com/v0/b/$Bucket/o?name=$EncodedPath&uploadType=resumable"

Write-Host "Testing CORS for bucket: $Bucket" -ForegroundColor Yellow
Write-Host "Path: $Path" -ForegroundColor Yellow
Write-Host "URL: $Url" -ForegroundColor Yellow
Write-Host ""

try {
    # Make the OPTIONS request
    $Response = Invoke-WebRequest -Uri $Url -Method OPTIONS -Headers @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type,x-goog-upload-protocol,x-goog-upload-command,x-goog-upload-header-content-length,x-goog-upload-content-type"
    } -UseBasicParsing

    Write-Host "✅ CORS Test Result:" -ForegroundColor Green
    Write-Host "Status Code: $($Response.StatusCode)" -ForegroundColor Green
    Write-Host "Status Description: $($Response.StatusDescription)" -ForegroundColor Green
    Write-Host ""
    
    # Check for CORS headers
    $CorsHeaders = @(
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods", 
        "Access-Control-Allow-Headers",
        "Access-Control-Max-Age"
    )
    
    Write-Host "CORS Headers:" -ForegroundColor Cyan
    foreach ($Header in $CorsHeaders) {
        if ($Response.Headers.ContainsKey($Header)) {
            Write-Host "  $Header`: $($Response.Headers[$Header])" -ForegroundColor Green
        } else {
            Write-Host "  $Header`: MISSING" -ForegroundColor Red
        }
    }
    
    if ($Response.StatusCode -eq 204) {
        Write-Host ""
        Write-Host "🎉 CORS is properly configured!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Unexpected status code. Check CORS configuration." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ CORS Test Failed:" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify bucket name is correct" -ForegroundColor Yellow
    Write-Host "2. Check CORS configuration is applied" -ForegroundColor Yellow
    Write-Host "3. Ensure you have proper permissions" -ForegroundColor Yellow
}

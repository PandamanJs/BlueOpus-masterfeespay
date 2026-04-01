# QuickBooks Manual Sync Script
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9va3puenlvcmp6bXJ5dWxrdGl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQ0NzI5MCwiZXhwIjoyMDUwMDIzMjkwfQ.yCCBRlhMBXDrZVXMHdRLPJLWOFXwVWZWbQQKXJtLqJk"
$syncUrl = "https://ookznzyorjzmryulktiw.supabase.co/functions/v1/quickbooks-sync"

# Payment: K1.53
Write-Host "Syncing K1.53 payment (REF-1767992776464-451)..." -ForegroundColor Yellow
$body = '{"transaction_id":"6f586e02-fac9-4cf1-a535-174edb545792"}'

try {
    $response = Invoke-RestMethod -Uri $syncUrl -Method Post -ContentType "application/json" -Headers @{Authorization = "Bearer $serviceRoleKey" } -Body $body -TimeoutSec 120
    
    if ($response.success) {
        Write-Host "Success!" -ForegroundColor Green
        Write-Host "Invoice ID: $($response.invoice.Id)"
        Write-Host "Payment ID: $($response.payment.Id)"
    }
    else {
        Write-Host "Failed: $($response.error)" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done! Check QuickBooks." -ForegroundColor Cyan

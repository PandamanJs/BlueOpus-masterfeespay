#!/bin/bash
# Script to help deploy quickbooks-sync function
# This creates a clean copy for deployment

cp "c:\Users\Pandaman js\Desktop\masterfeespay\src\supabase\functions\quickbooks-sync\index.ts" ./quickbooks-sync-deploy.ts

echo "File copied to quickbooks-sync-deploy.ts"
echo "You can now upload this file to Supabase dashboard"

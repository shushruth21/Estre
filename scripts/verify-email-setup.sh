#!/bin/bash

# Email Setup Verification Script
# This script helps verify that email setup is complete

echo "🔍 Verifying Email Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if migration files exist
echo "📋 Checking migration files..."

if [ -f "supabase/migrations/20251202000001_create_email_logs.sql" ]; then
    echo -e "${GREEN}✅ email_logs migration exists${NC}"
else
    echo -e "${RED}❌ email_logs migration missing${NC}"
fi

if [ -f "supabase/migrations/20251202000002_add_customer_fields_to_sale_orders.sql" ]; then
    echo -e "${GREEN}✅ sale_orders customer fields migration exists${NC}"
else
    echo -e "${RED}❌ sale_orders customer fields migration missing${NC}"
fi

echo ""

# Check if Edge Functions exist
echo "🔧 Checking Edge Functions..."

if [ -d "supabase/functions/generate-sale-order-pdf" ]; then
    echo -e "${GREEN}✅ generate-sale-order-pdf function exists${NC}"
else
    echo -e "${RED}❌ generate-sale-order-pdf function missing${NC}"
fi

if [ -d "supabase/functions/send-sale-order-pdf-after-otp" ]; then
    echo -e "${GREEN}✅ send-sale-order-pdf-after-otp function exists${NC}"
else
    echo -e "${RED}❌ send-sale-order-pdf-after-otp function missing${NC}"
fi

echo ""

# Check if email templates exist
echo "📧 Checking email templates..."

if [ -f "supabase/functions/_shared/emailTemplates.ts" ]; then
    echo -e "${GREEN}✅ Email templates exist${NC}"
else
    echo -e "${RED}❌ Email templates missing${NC}"
fi

if [ -f "supabase/functions/_shared/emailLogger.ts" ]; then
    echo -e "${GREEN}✅ Email logger exists${NC}"
else
    echo -e "${RED}❌ Email logger missing${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Apply migrations:"
echo "   ${YELLOW}supabase db push${NC}"
echo ""
echo "2. Deploy Edge Functions:"
echo "   ${YELLOW}supabase functions deploy generate-sale-order-pdf${NC}"
echo "   ${YELLOW}supabase functions deploy send-sale-order-pdf-after-otp${NC}"
echo ""
echo "3. Verify RESEND_API_KEY is set in Supabase Dashboard:"
echo "   ${YELLOW}Project Settings → Edge Functions → Secrets${NC}"
echo ""
echo "4. Test email flow by placing a test order"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""







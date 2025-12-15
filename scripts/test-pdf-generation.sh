#!/bin/bash

# PDF Generation Test Script
# Tests both sale order PDF and job card PDF generation

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Supabase Configuration
SUPABASE_URL="https://ljgmqwnamffvvrwgprsd.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  PDF Generation Test Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to test Sale Order PDF
test_sale_order_pdf() {
  echo -e "${YELLOW}Testing Sale Order PDF Generation...${NC}"
  echo ""
  
  if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Sale Order ID required${NC}"
    echo "Usage: $0 sale-order <sale_order_id>"
    echo ""
    echo "To get a sale order ID, run this SQL in Supabase:"
    echo "SELECT id, order_number FROM sale_orders ORDER BY created_at DESC LIMIT 1;"
    return 1
  fi
  
  SALE_ORDER_ID=$1
  
  echo -e "${BLUE}Sale Order ID: ${SALE_ORDER_ID}${NC}"
  echo ""
  
  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/generate-sale-order-pdf" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"saleOrderId\": \"${SALE_ORDER_ID}\",
      \"mode\": \"final\",
      \"requireOTP\": false,
      \"skipEmail\": true
    }")
  
  echo -e "${BLUE}Response:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo ""
  
  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    PDF_URL=$(echo "$RESPONSE" | jq -r '.pdfUrl' 2>/dev/null)
    if [ "$PDF_URL" != "null" ] && [ -n "$PDF_URL" ]; then
      echo -e "${GREEN}✅ PDF Generated Successfully!${NC}"
      echo -e "${GREEN}PDF URL: ${PDF_URL}${NC}"
      echo ""
      echo "Open this URL in your browser to view the PDF:"
      echo "$PDF_URL"
    else
      echo -e "${YELLOW}⚠️  Response indicates success but no PDF URL found${NC}"
    fi
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "$RESPONSE")
    echo -e "${RED}❌ PDF Generation Failed: ${ERROR}${NC}"
  fi
}

# Function to test Job Card PDF
test_job_card_pdf() {
  echo -e "${YELLOW}Testing Job Card PDF Generation...${NC}"
  echo ""
  
  if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Job Card ID required${NC}"
    echo "Usage: $0 job-card <job_card_id>"
    echo ""
    echo "To get a job card ID, run this SQL in Supabase:"
    echo "SELECT id, job_card_number FROM job_cards ORDER BY created_at DESC LIMIT 1;"
    return 1
  fi
  
  JOB_CARD_ID=$1
  
  echo -e "${BLUE}Job Card ID: ${JOB_CARD_ID}${NC}"
  echo ""
  
  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/generate-job-card-pdf" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"jobCardId\": \"${JOB_CARD_ID}\",
      \"mode\": \"final\"
    }")
  
  echo -e "${BLUE}Response:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo ""
  
  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    PDF_URL=$(echo "$RESPONSE" | jq -r '.pdfUrl' 2>/dev/null)
    if [ "$PDF_URL" != "null" ] && [ -n "$PDF_URL" ]; then
      echo -e "${GREEN}✅ PDF Generated Successfully!${NC}"
      echo -e "${GREEN}PDF URL: ${PDF_URL}${NC}"
      echo ""
      echo "Open this URL in your browser to view the PDF:"
      echo "$PDF_URL"
    else
      echo -e "${YELLOW}⚠️  Response indicates success but no PDF URL found${NC}"
    fi
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "$RESPONSE")
    echo -e "${RED}❌ PDF Generation Failed: ${ERROR}${NC}"
  fi
}

# Main menu
case "$1" in
  sale-order)
    test_sale_order_pdf "$2"
    ;;
  job-card)
    test_job_card_pdf "$2"
    ;;
  *)
    echo -e "${BLUE}PDF Generation Test Script${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 sale-order <sale_order_id>  - Test sale order PDF generation"
    echo "  $0 job-card <job_card_id>      - Test job card PDF generation"
    echo ""
    echo "Examples:"
    echo "  $0 sale-order abc123-def456-ghi789"
    echo "  $0 job-card xyz789-abc123-def456"
    echo ""
    echo "To get IDs, run these SQL queries in Supabase:"
    echo ""
    echo "Sale Orders:"
    echo "  SELECT id, order_number, customer_email FROM sale_orders ORDER BY created_at DESC LIMIT 5;"
    echo ""
    echo "Job Cards:"
    echo "  SELECT id, job_card_number FROM job_cards ORDER BY created_at DESC LIMIT 5;"
    ;;
esac














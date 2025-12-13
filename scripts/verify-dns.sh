#!/bin/bash

# DNS Verification Script for estre.app
# Checks SPF, MX, and TXT records to ensure email deliverability

echo "================================================"
echo "DNS Verification for estre.app"
echo "================================================"
echo ""

DOMAIN="estre.app"
PASSED=0
FAILED=0

# Check SPF Record
echo "🔍 Checking SPF Record..."
SPF_RECORD=$(dig +short TXT $DOMAIN | grep "v=spf1")

if [ -z "$SPF_RECORD" ]; then
    echo "❌ FAILED: No SPF record found"
    FAILED=$((FAILED+1))
else
    echo "✅ SPF Record Found: $SPF_RECORD"

    # Check if Resend is included
    if echo "$SPF_RECORD" | grep -q "_spf.resend.com"; then
        echo "✅ PASSED: Resend is authorized in SPF"
        PASSED=$((PASSED+1))
    else
        echo "❌ FAILED: Resend is NOT authorized in SPF"
        echo "   Expected: include:_spf.resend.com"
        FAILED=$((FAILED+1))
    fi

    # Check if Hostinger is included
    if echo "$SPF_RECORD" | grep -q "_spf.mail.hostinger.com"; then
        echo "✅ PASSED: Hostinger is authorized in SPF"
        PASSED=$((PASSED+1))
    else
        echo "⚠️  WARNING: Hostinger not in SPF (may be intentional)"
    fi
fi

echo ""

# Check for unwanted Amazon SES records
echo "🔍 Checking for Unwanted Amazon SES Records..."
SES_TXT=$(dig +short TXT send.$DOMAIN | grep "amazonses")
SES_MX=$(dig +short MX send.$DOMAIN | grep "amazonses")

if [ -z "$SES_TXT" ] && [ -z "$SES_MX" ]; then
    echo "✅ PASSED: No Amazon SES records found (good)"
    PASSED=$((PASSED+1))
else
    if [ -n "$SES_TXT" ]; then
        echo "⚠️  WARNING: Amazon SES TXT record still exists"
        echo "   Record: $SES_TXT"
        echo "   Recommendation: Delete this record (not used)"
    fi
    if [ -n "$SES_MX" ]; then
        echo "⚠️  WARNING: Amazon SES MX record still exists"
        echo "   Record: $SES_MX"
        echo "   Recommendation: Delete this record (not used)"
    fi
fi

echo ""

# Check MX Records
echo "🔍 Checking MX Records..."
MX_RECORDS=$(dig +short MX $DOMAIN)

if [ -z "$MX_RECORDS" ]; then
    echo "⚠️  WARNING: No MX records found"
    echo "   This is okay if you don't receive emails at @estre.app"
else
    echo "✅ MX Records Found:"
    echo "$MX_RECORDS"
    PASSED=$((PASSED+1))
fi

echo ""

# Check DKIM (optional)
echo "🔍 Checking DKIM Records (optional)..."
DKIM_RECORD=$(dig +short TXT resend._domainkey.$DOMAIN)

if [ -z "$DKIM_RECORD" ]; then
    echo "ℹ️  INFO: No DKIM record found for Resend"
    echo "   This is optional but recommended for better deliverability"
    echo "   Get DKIM record from Resend dashboard and add to DNS"
else
    echo "✅ DKIM Record Found (excellent!)"
    PASSED=$((PASSED+1))
fi

echo ""

# Check DMARC (optional)
echo "🔍 Checking DMARC Policy (optional)..."
DMARC_RECORD=$(dig +short TXT _dmarc.$DOMAIN)

if [ -z "$DMARC_RECORD" ]; then
    echo "ℹ️  INFO: No DMARC policy found"
    echo "   This is optional but recommended for email security"
    echo "   Add: v=DMARC1; p=none; rua=mailto:dmarc@estre.app"
else
    echo "✅ DMARC Policy Found: $DMARC_RECORD"
    PASSED=$((PASSED+1))
fi

echo ""
echo "================================================"
echo "Summary"
echo "================================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All critical DNS checks passed!"
    echo "Your email configuration looks good."
    exit 0
else
    echo "⚠️  Some DNS checks failed."
    echo "Please review the DNS_FIX_GUIDE.md for instructions."
    exit 1
fi

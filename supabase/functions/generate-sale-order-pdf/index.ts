/**
 * Supabase Edge Function: Generate Sale Order PDF
 * 
 * This function:
 * 1. Fetches sale order data with customer and order details
 * 2. Generates HTML using template
 * 3. Converts HTML to PDF using Browserless API (or Playwright)
 * 4. Uploads PDF to Supabase Storage (draft or final)
 * 5. Updates sale_order with PDF URL and HTML (draft_html/final_html, draft_pdf_url/final_pdf_url)
 * 6. Sends email to customer with PDF attachment (final mode only)
 * 7. Generates and sends OTP to customer (if requireOTP = true)
 * 
 * Parameters:
 * - saleOrderId: Required - ID of the sale order
 * - mode: Optional - "draft" (preview) or "final" (send to customer), default: "final"
 * - requireOTP: Optional - Generate OTP for customer confirmation, default: false
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import HTML template generator
import { generateSaleOrderHTML } from "../_shared/htmlTemplates.ts";

// Import email template
import { saleOrderApprovedEmailHTML } from "../_shared/emailTemplates.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { saleOrderId, mode = "final", requireOTP = false } = await req.json();

    if (!saleOrderId) {
      return new Response(
        JSON.stringify({ error: "saleOrderId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (mode !== "draft" && mode !== "final") {
      return new Response(
        JSON.stringify({ error: "mode must be 'draft' or 'final'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sale order data with pricing_breakdown
    const { data: saleOrder, error: saleOrderError } = await supabase
      .from("sale_orders")
      .select(`
        *,
        order:orders(
          *,
          order_items:order_items(*)
        )
      `)
      .eq("id", saleOrderId)
      .single();

    if (saleOrderError || !saleOrder) {
      throw new Error(`Sale order not found: ${saleOrderError?.message}`);
    }

    // Get pricing breakdown from sale order or generate from order items
    let pricingBreakdown = saleOrder.pricing_breakdown;
    if (!pricingBreakdown && saleOrder.order?.order_items) {
      // If pricing_breakdown doesn't exist, we need to reconstruct it
      // For now, use a basic structure
      pricingBreakdown = {
        products: [],
        gst: 0,
        total: saleOrder.final_price,
      };
    }

    // Prepare template data
    const order = saleOrder.order || {};
    const customerAddress = saleOrder.customer_address || order.delivery_address || {};
    
    const templateData = {
      so_number: saleOrder.order_number || `SO-${saleOrder.id.slice(0, 8)}`,
      order_date: new Date(saleOrder.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      customer_name: saleOrder.customer_name || order.customer_name || "",
      customer_address_street: customerAddress.street || customerAddress.lines?.[0] || "",
      customer_address_city: customerAddress.city || "",
      customer_address_state: customerAddress.state || "",
      customer_address_pincode: customerAddress.pincode || "",
      customer_phone: saleOrder.customer_phone || order.customer_phone || "",
      customer_email: saleOrder.customer_email || order.customer_email || "",
      delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      dispatch_through: order.logistics_partner || "Safe Express",
      estre_gst: "29AAMCE9846D1ZU",
      buyer_gst: order.buyer_gst || "",
      pricing_breakdown: pricingBreakdown,
    };

    // Generate HTML
    const htmlContent = generateSaleOrderHTML(templateData);

    // Convert HTML to PDF using Browserless API (recommended) or Playwright
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    const browserlessUrl = Deno.env.get("BROWSERLESS_URL") || "https://chrome.browserless.io";

    let pdfBytes: Uint8Array;

    if (browserlessApiKey) {
      // Use Browserless API
      const htmlBase64 = btoa(unescape(encodeURIComponent(htmlContent)));
      
      const browserlessResponse = await fetch(`${browserlessUrl}/pdf?token=${browserlessApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
          options: {
            format: "A4",
            printBackground: true,
            margin: {
              top: "10mm",
              right: "10mm",
              bottom: "10mm",
              left: "10mm",
            },
          },
        }),
      });

      if (!browserlessResponse.ok) {
        throw new Error(`Browserless API error: ${browserlessResponse.statusText}`);
      }

      pdfBytes = new Uint8Array(await browserlessResponse.arrayBuffer());
    } else {
      // Fallback: Use Playwright in Deno (if available)
      // For now, return error if Browserless is not configured
      throw new Error(
        "PDF generation requires Browserless API. Please set BROWSERLESS_API_KEY environment variable."
      );
    }

    // Upload to Supabase Storage - different paths for draft vs final
    const fileName = mode === "draft" 
      ? `sale-orders/draft/${saleOrderId}.pdf`
      : `sale-orders/final/${saleOrderId}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Handle draft vs final mode
    if (mode === "draft") {
      // Draft mode: Only update draft_pdf_url and draft_html, don't send email
      const { error: updateError } = await supabase
        .from("sale_orders")
        .update({
          draft_pdf_url: urlData.publicUrl,
          draft_html: htmlContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleOrderId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Draft PDF generated successfully",
          saleOrderId,
          pdfUrl: urlData.publicUrl,
          mode: "draft",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Final mode: Generate OTP if required, update final_pdf_url and final_html, send email
    const otp = requireOTP ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    const otpExpiresAt = requireOTP ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;

    // Update sale_order with final PDF URL, HTML, OTP (if required), and status
    const updateData: any = {
      final_pdf_url: urlData.publicUrl,
      final_html: htmlContent,
      updated_at: new Date().toISOString(),
    };

    if (requireOTP) {
      updateData.otp_code = otp;
      updateData.otp_expires_at = otpExpiresAt;
      updateData.require_otp = true;
    }

    // Only update status if it's not already staff_approved (preserve existing status)
    if (saleOrder.status === "pending_review" || saleOrder.status === "staff_editing") {
      updateData.status = "staff_pdf_generated";
    }

    const { error: updateError } = await supabase
      .from("sale_orders")
      .update(updateData)
      .eq("id", saleOrderId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Send email with PDF and OTP (via Resend) - only for final mode
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        // Convert PDF bytes to base64 for email attachment
        const base64Pdf = btoa(
          Array.from(pdfBytes)
            .map((byte: number) => String.fromCharCode(byte))
            .join("")
        );

        // Generate email HTML using template
        const emailHTML = saleOrderApprovedEmailHTML({
          customerName: templateData.customer_name,
          pdfUrl: urlData.publicUrl,
          otp: otp,
          orderNumber: templateData.so_number,
        });

        // Send single email with PDF attachment
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Estre <orders@estre.in>",
            to: templateData.customer_email,
            subject: "Your Estre Sale Order is Ready",
            html: emailHTML,
            attachments: [
              {
                filename: `sale-order-${templateData.so_number}.pdf`,
                content: base64Pdf,
              },
            ],
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error("Email failed:", errorText);
          // Don't throw - PDF generation succeeded, email can be retried
        } else {
          console.log("Email sent successfully to", templateData.customer_email);
        }
      } catch (emailError) {
        console.error("Email error:", emailError);
        // Don't throw - PDF generation succeeded, email can be retried
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: mode === "draft" ? "Draft PDF generated successfully" : "Final PDF generated and email sent",
        saleOrderId,
        pdfUrl: urlData.publicUrl,
        mode: mode,
        requireOTP: requireOTP,
        otpGenerated: !!otp,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate PDF",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

/**
 * Supabase Edge Function: Generate Sale Order PDF
 * 
 * This function:
 * 1. Fetches sale order data with customer and order details
 * 2. Generates HTML using template
 * 3. Converts HTML to PDF using PDFGeneratorAPI (primary) or Browserless API (fallback)
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
import { logEmail } from "../_shared/emailLogger.ts";

// Import HTML template generator
import { generateSaleOrderHTML } from "../_shared/htmlTemplates.ts";

// Import premium templates
import { generatePremiumSaleOrderHTML } from "../_shared/premiumSaleOrderTemplate.ts";
import { mapSaleOrderData } from "../_shared/mapSaleOrderData.ts";
import { browserlessPdf } from "../_shared/browserlessPdf.ts";

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
    const { saleOrderId, mode = "final", requireOTP = false, skipEmail = false } = await req.json();

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
          order_items:order_items(
            id,
            quantity,
            unit_price_rs,
            total_price_rs,
            product_title,
            product_category,
            configuration
          )
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

    let htmlContent: string;

    // Generate HTML from premium template
    try {
      // Use new premium template system
      const premiumTemplateData = mapSaleOrderData(saleOrder);
      htmlContent = generatePremiumSaleOrderHTML(premiumTemplateData);
      console.log("✅ Premium template generated successfully");
    } catch (premiumError) {
      console.warn("⚠️ Premium template failed, falling back to legacy:", premiumError);
      // Fallback to old template if premium fails
      htmlContent = generateSaleOrderHTML(templateData);
    }

    // Convert HTML to PDF using PDFGeneratorAPI (primary) or Browserless API (fallback)
    const pdfGeneratorApiKey = Deno.env.get("PDF_GENERATOR_API_KEY");
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    const pdfGeneratorUrl = "https://us1.pdfgeneratorapi.com/api/v4/documents/generate";
    const browserlessUrl = Deno.env.get("BROWSERLESS_URL") || "https://chrome.browserless.io";

    let pdfBytes: Uint8Array | null = null;

    // Try PDFGeneratorAPI first, fallback to Browserless if not available
    if (pdfGeneratorApiKey) {
      try {
        // Use PDFGeneratorAPI with HTML
        const pdfResponse = await fetch(pdfGeneratorUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${pdfGeneratorApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html: htmlContent,
            format: "pdf",
            output: "base64", // Get PDF as base64
            name: `Sale-Order-${templateData.so_number}`,
          }),
        });

        if (!pdfResponse.ok) {
          const errorText = await pdfResponse.text();
          console.error(`PDFGeneratorAPI error: ${pdfResponse.status} ${errorText}`);
          throw new Error(`PDFGeneratorAPI error: ${pdfResponse.status} ${errorText}`);
        }

        const result = await pdfResponse.json();
        // Handle different response formats from PDFGeneratorAPI
        const base64Data = result.response || result.data || result.pdf || result.body;

        if (!base64Data) {
          console.error("PDFGeneratorAPI response:", result);
          throw new Error("PDFGeneratorAPI response missing PDF data. Check API response format.");
        }

        // Convert base64 to Uint8Array
        pdfBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        console.log(`PDF generated successfully using PDFGeneratorAPI (${pdfBytes.length} bytes)`);
      } catch (pdfGenError: any) {
        console.error("PDFGeneratorAPI failed, trying Browserless fallback:", pdfGenError);
        // Fall through to Browserless if PDFGeneratorAPI fails
      }
    }

    // Fallback to Browserless API if PDFGeneratorAPI not configured or failed
    if (!pdfBytes && browserlessApiKey) {
      try {
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
        console.log(`PDF generated successfully using Browserless API (${pdfBytes.length} bytes)`);
      } catch (browserlessError: any) {
        console.error("Browserless API also failed:", browserlessError);
        throw new Error(
          `PDF generation failed. PDFGeneratorAPI: ${pdfGeneratorApiKey ? "failed" : "not configured"}. Browserless: ${browserlessError.message}`
        );
      }
    }

    // If neither API is configured or both failed
    if (!pdfBytes) {
      throw new Error(
        "PDF generation requires either PDF_GENERATOR_API_KEY or BROWSERLESS_API_KEY. Please set at least one in Supabase secrets."
      );
    }

    // At this point, pdfBytes is guaranteed to be Uint8Array
    const finalPdfBytes: Uint8Array = pdfBytes;

    // Upload to Supabase Storage - different paths for draft vs final
    const fileName = mode === "draft"
      ? `sale-orders/draft/${saleOrderId}.pdf`
      : `sale-orders/final/${saleOrderId}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, finalPdfBytes, {
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

      // Convert PDF bytes to base64 for response
      const base64Pdf = btoa(
        Array.from(finalPdfBytes)
          .map((byte: number) => String.fromCharCode(byte))
          .join("")
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Draft PDF generated successfully",
          saleOrderId,
          pdfUrl: urlData.publicUrl,
          pdfBase64: base64Pdf,
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

    // Automatically transition to appropriate status after final PDF generation
    // This ensures customers can see the PDF immediately after staff generates it
    if (saleOrder.status === "pending_review" || saleOrder.status === "staff_editing" || saleOrder.status === "staff_pdf_generated") {
      if (requireOTP) {
        updateData.status = "staff_approved"; // Customer needs to enter OTP
      } else {
        updateData.status = "customer_confirmation_pending"; // Customer can confirm directly
      }
    }

    const { error: updateError } = await supabase
      .from("sale_orders")
      .update(updateData)
      .eq("id", saleOrderId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Convert PDF bytes to base64 (needed for both email and response)
    const base64Pdf = btoa(
      Array.from(finalPdfBytes)
        .map((byte: number) => String.fromCharCode(byte))
        .join("")
    );

    // Send email with PDF and OTP (via Resend) - only for final mode and if skipEmail is false
    let emailSent = false;
    let emailError: string | null = null;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey && !skipEmail) {
      emailError = "RESEND_API_KEY not configured. Please configure Resend API key in Supabase secrets.";
      console.warn("⚠️ Email not sent:", emailError);
      
      // Log missing configuration
      await logEmail(supabase, {
        recipientEmail: templateData.customer_email,
        recipientName: templateData.customer_name,
        subject: "Your Estre Sale Order is Ready",
        emailType: 'sale_order',
        saleOrderId: saleOrderId,
        orderId: saleOrder.order_id || order.id || null,
        status: 'failed',
        errorMessage: emailError,
      });
    } else if (resendApiKey && !skipEmail) {
      try {
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
            from: "Estre <no-reply@estre.app>",
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
          
          emailError = errorText;
          
          // Log failed email
          await logEmail(supabase, {
            recipientEmail: templateData.customer_email,
            recipientName: templateData.customer_name,
            subject: "Your Estre Sale Order is Ready",
            emailType: 'sale_order',
            saleOrderId: saleOrderId,
            orderId: saleOrder.order_id || order.id || null,
            status: 'failed',
            errorMessage: errorText,
          });
          
          // Don't throw - PDF generation succeeded, email can be retried
        } else {
          console.log("Email sent successfully to", templateData.customer_email);
          emailSent = true;
          
          // Log successful email send
          const emailResult = await emailResponse.json();
          await logEmail(supabase, {
            recipientEmail: templateData.customer_email,
            recipientName: templateData.customer_name,
            subject: "Your Estre Sale Order is Ready",
            emailType: 'sale_order',
            saleOrderId: saleOrderId,
            orderId: saleOrder.order_id || order.id || null,
            status: 'sent',
            providerMessageId: emailResult?.id || null,
            providerResponse: emailResult,
            metadata: { otp_sent: !!otp, mode: 'final' },
          });
        }
      } catch (emailError) {
        console.error("Email error:", emailError);
        
        emailError = emailError instanceof Error ? emailError.message : String(emailError);
        
        // Log email error
        await logEmail(supabase, {
          recipientEmail: templateData.customer_email,
          recipientName: templateData.customer_name,
          subject: "Your Estre Sale Order is Ready",
          emailType: 'sale_order',
          saleOrderId: saleOrderId,
          orderId: saleOrder.order_id || order.id || null,
          status: 'failed',
          errorMessage: emailError,
        });
        
        // Don't throw - PDF generation succeeded, email can be retried
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: mode === "draft" 
          ? "Draft PDF generated successfully" 
          : "Final PDF generated" + (emailSent ? " and email sent" : (emailError ? " but email failed" : "")),
        saleOrderId,
        pdfUrl: urlData.publicUrl,
        pdfBase64: base64Pdf,
        mode: mode,
        requireOTP: requireOTP,
        otpGenerated: !!otp,
        emailSent: emailSent,
        emailError: emailError || undefined,
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

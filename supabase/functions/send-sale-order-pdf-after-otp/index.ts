/**
 * Edge Function: Send Sale Order PDF After OTP Verification
 * 
 * Sends the sale order PDF to customer email after OTP verification
 * Email sent from: no-reply@estre.app
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { saleOrderConfirmedEmailHTML } from "../_shared/emailTemplates.ts";
import { logEmail } from "../_shared/emailLogger.ts";
import { logError } from "../_shared/logger.ts";

serve(async (req) => {
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

  let saleOrderId: string | null = null;

  try {
    const requestBody = await req.json();
    saleOrderId = requestBody.saleOrderId;

    if (!saleOrderId) {
      return new Response(
        JSON.stringify({ error: "saleOrderId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sale order with PDF URL
    const { data: saleOrder, error: saleOrderError } = await supabase
      .from("sale_orders")
      .select(`
        *,
        order:orders(
          order_number,
          customer_name,
          customer_email
        )
      `)
      .eq("id", saleOrderId)
      .single();

    if (saleOrderError || !saleOrder) {
      throw new Error(`Sale order not found: ${saleOrderError?.message}`);
    }

    // ==========================================
    // IDEMPOTENCY CHECK
    // ==========================================
    // Check if we already sent this recently
    const { data: recentLogs } = await supabase
      .from("email_logs")
      .select("id, sent_at")
      .eq("sale_order_id", saleOrderId)
      .eq("email_type", "sale_order")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1);

    // Also check metadata flag
    const lastSentAt = saleOrder.metadata?.pdf_sent_to_customer_at;
    const isRecentlySentInLog = recentLogs && recentLogs.length > 0 &&
      (new Date().getTime() - new Date(recentLogs[0].sent_at).getTime() < 5 * 60 * 1000);

    // If sent within last 5 minutes, skip
    if (isRecentlySentInLog) {
      console.log("Idempotency: Email already sent recently. Skipping.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email already sent recently (idempotent)",
          emailSent: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if PDF exists
    const pdfUrl = saleOrder.final_pdf_url || saleOrder.pdf_url;
    if (!pdfUrl) {
      throw new Error("Sale order PDF not found. Please generate PDF first.");
    }

    // Extract storage path from URL
    let storagePath = "";
    try {
      const url = new URL(pdfUrl);
      const pathParts = url.pathname.split('/storage/v1/object/public/');
      if (pathParts.length > 1) {
        storagePath = pathParts[1];
      } else {
        // Try signed URL format
        const signedParts = url.pathname.split('/storage/v1/object/sign/');
        if (signedParts.length > 1) {
          storagePath = signedParts[1];
        }
      }

      // If still empty, try manual parsing for relative paths or other formats
      if (!storagePath) {
        if (pdfUrl.includes('/storage/v1/object/public/')) {
          storagePath = pdfUrl.split('/storage/v1/object/public/')[1];
        } else if (pdfUrl.includes('/storage/v1/object/sign/')) {
          storagePath = pdfUrl.split('/storage/v1/object/sign/')[1]?.split('?')[0];
        }
      }
    } catch (e) {
      logError("Error parsing PDF URL", e, { pdfUrl });
      // Fallback to simple string splitting
      if (pdfUrl.includes('/storage/v1/object/public/')) {
        storagePath = pdfUrl.split('/storage/v1/object/public/')[1];
      }
    }

    if (!storagePath) {
      logError("Could not extract storage path from URL", null, { pdfUrl });
      throw new Error("Invalid PDF URL format");
    }

    // Download PDF from Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError || !pdfData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    // Convert to base64
    const pdfArrayBuffer = await pdfData.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    const base64Pdf = btoa(
      Array.from(pdfBytes)
        .map((byte: number) => String.fromCharCode(byte))
        .join("")
    );

    // Get customer info
    const order = saleOrder.order || {};
    const customerEmail = saleOrder.customer_email || order.customer_email;
    const customerName = saleOrder.customer_name || order.customer_name || "Customer";
    const orderNumber = saleOrder.order_number || order.order_number || `SO-${saleOrderId.slice(0, 8)}`;

    // Generate email HTML using shared template
    const emailHTML = saleOrderConfirmedEmailHTML({
      customerName,
      pdfUrl,
      orderNumber
    });

    // Send email with PDF attachment from no-reply@estre.app
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Estre <no-reply@estre.app>",
        to: customerEmail,
        subject: `Your Confirmed Sale Order - ${orderNumber}`,
        html: emailHTML,
        attachments: [
          {
            filename: `sale-order-${orderNumber}.pdf`,
            content: base64Pdf,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();

      // Log failed email
      await logEmail(supabase, {
        recipient_email: customerEmail,
        recipient_name: customerName,
        subject: `Your Confirmed Sale Order - ${orderNumber}`,
        email_type: 'sale_order',
        sale_order_id: saleOrderId,
        order_id: saleOrder.order?.id || undefined,
        status: 'failed',
        error_message: errorText,
      });

      throw new Error(`Email failed: ${errorText}`);
    }

    // Log successful email send
    const emailResult = await emailResponse.json();
    await logEmail(supabase, {
      recipient_email: customerEmail,
      recipient_name: customerName,
      subject: `Your Confirmed Sale Order - ${orderNumber}`,
      email_type: 'sale_order',
      sale_order_id: saleOrderId,
      order_id: saleOrder.order?.id || undefined,
      status: 'sent',
      provider_message_id: emailResult?.id || undefined,
      provider_response: emailResult,
    });

    // Update sale order to mark PDF as sent
    await supabase
      .from("sale_orders")
      .update({
        metadata: {
          ...(saleOrder.metadata || {}),
          pdf_sent_to_customer_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", saleOrderId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sale order PDF sent to customer email",
        emailSent: true,
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
    logError("FATAL_ERROR", error, { saleOrderId });

    // Log failed email if we have the saleOrderId
    if (saleOrderId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await logEmail(supabase, {
          recipient_email: 'unknown',
          subject: `Sale Order PDF - ${saleOrderId}`,
          email_type: 'sale_order',
          sale_order_id: saleOrderId,
          status: 'failed',
          error_message: error.message || error.toString(),
        });
      } catch (logErr) {
        // Ignore logging errors - don't fail the main error response
        console.error("Failed to log email error:", logErr);
      }
    }

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send PDF email",
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




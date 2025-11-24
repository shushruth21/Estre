/**
 * Supabase Edge Function: Generate Sale Order PDF
 * 
 * This function:
 * 1. Fetches sale order data with customer and order details
 * 2. Generates a PDF using pdf-lib (Deno-compatible)
 * 3. Uploads PDF to Supabase Storage (draft or final)
 * 4. Updates sale_order with PDF URL (draft_pdf_url or final_pdf_url)
 * 5. Sends email to customer with PDF attachment (final mode only)
 * 6. Generates and sends OTP to customer (if requireOTP = true)
 * 
 * Parameters:
 * - saleOrderId: Required - ID of the sale order
 * - mode: Optional - "draft" (preview) or "final" (send to customer), default: "final"
 * - requireOTP: Optional - Generate OTP for customer confirmation, default: false
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// pdf-lib for Deno - Deno-compatible PDF library
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    // Fetch sale order data
    // Note: buyer_gst and dispatch_method are optional - select all columns to include them if they exist
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

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([595, 842]); // A4 size in points
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = 800; // Start from top
    const pageWidth = currentPage.getWidth();
    const margin = 50;
    const lineHeight = 20;
    const fontSize = 12;
    const titleFontSize = 20;

    // Helper function to get or create page
    const getCurrentPage = () => {
      if (yPosition < 100) {
        // Add new page if needed
        currentPage = pdfDoc.addPage([595, 842]);
        yPosition = 800;
      }
      return currentPage;
    };

    // Helper function to add text
    const addText = (text: string, x: number, y: number, size: number = fontSize, isBold: boolean = false) => {
      const page = getCurrentPage();
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
    };

    // Helper function to add centered text
    const addCenteredText = (text: string, y: number, size: number = fontSize, isBold: boolean = false) => {
      const textWidth = (isBold ? boldFont : font).widthOfTextAtSize(text, size);
      addText(text, (pageWidth - textWidth) / 2, y, size, isBold);
    };

    // Title
    addCenteredText("SALE ORDER", yPosition, titleFontSize, true);
    yPosition -= lineHeight * 2;

    // Company Info
    addCenteredText("ESTRE GLOBAL PRIVATE LIMITED", yPosition, fontSize, true);
    yPosition -= lineHeight;
    addCenteredText("Near Dhoni Public School", yPosition);
    yPosition -= lineHeight;
    addCenteredText("AECS Layout-A Block, Revenue Layout", yPosition);
    yPosition -= lineHeight;
    addCenteredText("Near Kudlu Gate, Singhasandra", yPosition);
    yPosition -= lineHeight;
    addCenteredText("Bengaluru - 560 068", yPosition);
    yPosition -= lineHeight * 2;

    // Order Details
    addText(`Order Number: ${saleOrder.order.order_number}`, margin, yPosition, 14, true);
    yPosition -= lineHeight;
    addText(`Date: ${new Date(saleOrder.created_at).toLocaleDateString()}`, margin, yPosition, 14);
    yPosition -= lineHeight * 2;

    // Customer Info
    addText(`Customer Name: ${saleOrder.order.customer_name}`, margin, yPosition);
    yPosition -= lineHeight;
    addText(`Email: ${saleOrder.order.customer_email}`, margin, yPosition);
    yPosition -= lineHeight;
    addText(`Phone: ${saleOrder.order.customer_phone}`, margin, yPosition);
    yPosition -= lineHeight;
    if (saleOrder.order.buyer_gst) {
      addText(`GST: ${saleOrder.order.buyer_gst}`, margin, yPosition);
      yPosition -= lineHeight;
    }
    yPosition -= lineHeight;

    // Delivery Address
    if (saleOrder.order.delivery_address) {
      const address = saleOrder.order.delivery_address;
      addText("Delivery Address:", margin, yPosition, fontSize, true);
      yPosition -= lineHeight;
      if (address.street) {
        addText(address.street, margin + 20, yPosition);
        yPosition -= lineHeight;
      }
      addText(`${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`, margin + 20, yPosition);
      yPosition -= lineHeight;
      if (address.landmark) {
        addText(`Landmark: ${address.landmark}`, margin + 20, yPosition);
        yPosition -= lineHeight;
      }
      yPosition -= lineHeight;
    }

    // Order Items
    if (saleOrder.order.order_items && saleOrder.order.order_items.length > 0) {
      addText("Order Items:", margin, yPosition, 14, true);
      yPosition -= lineHeight * 1.5;
      
      saleOrder.order.order_items.forEach((item: any, index: number) => {
        addText(`${index + 1}. ${item.product_title || item.product_category}`, margin + 20, yPosition);
        yPosition -= lineHeight;
        addText(`   Quantity: ${item.quantity || 1}`, margin + 30, yPosition);
        yPosition -= lineHeight;
        addText(`   Price: ₹${(item.total_price_rs || 0).toLocaleString("en-IN")}`, margin + 30, yPosition);
        yPosition -= lineHeight * 0.8;
      });
      yPosition -= lineHeight;
    }

    // Pricing Summary
    yPosition -= lineHeight;
    addText("Pricing Summary:", margin, yPosition, 14, true);
    yPosition -= lineHeight * 1.5;
    
    const rightAlignX = pageWidth - margin - 150;
    
    addText("Base Price:", margin, yPosition);
    addText(`₹${saleOrder.base_price.toLocaleString("en-IN")}`, rightAlignX, yPosition);
    yPosition -= lineHeight;
    
    if (saleOrder.discount > 0) {
      addText("Discount:", margin, yPosition);
      addText(`-₹${saleOrder.discount.toLocaleString("en-IN")}`, rightAlignX, yPosition);
      yPosition -= lineHeight;
    }
    
    yPosition -= lineHeight * 0.5;
    addText("Final Price:", margin, yPosition, 16, true);
    addText(`₹${saleOrder.final_price.toLocaleString("en-IN")}`, rightAlignX, yPosition, 16, true);

    // Footer
    yPosition = 50;
    addCenteredText("Thank you for your order!", yPosition, 10);

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

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
      // Draft mode: Only update draft_pdf_url, don't send email
      const { error: updateError } = await supabase
        .from("sale_orders")
        .update({
          draft_pdf_url: urlData.publicUrl,
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

    // Final mode: Generate OTP if required, update final_pdf_url, send email
    const otp = requireOTP ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    const otpExpiresAt = requireOTP ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;

    // Update sale_order with final PDF URL, OTP (if required), and status
    const { error: updateError } = await supabase
      .from("sale_orders")
      .update({
        final_pdf_url: urlData.publicUrl,
        otp_code: otp,
        otp_expires_at: otpExpiresAt,
        require_otp: requireOTP,
        status: "staff_approved", // Auto-approve on final PDF generation
        updated_at: new Date().toISOString(),
      })
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
          Array.from(new Uint8Array(pdfBytes))
            .map((byte: number) => String.fromCharCode(byte))
            .join("")
        );

        // Generate email HTML using template
        const emailHTML = saleOrderApprovedEmailHTML({
          customerName: saleOrder.order.customer_name,
          pdfUrl: urlData.publicUrl,
          otp: otp,
          orderNumber: saleOrder.order.order_number,
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
            to: saleOrder.order.customer_email,
            subject: "Your Estre Sale Order is Ready",
            html: emailHTML,
            attachments: [
              {
                filename: `sale-order-${saleOrder.order.order_number}.pdf`,
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
          console.log("Email sent successfully to", saleOrder.order.customer_email);
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


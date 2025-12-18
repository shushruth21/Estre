/**
 * Supabase Edge Function: Send Email with PDF
 *
 * Dedicated function for sending emails with PDF attachments via Resend API
 *
 * Features:
 * - Send sale order PDFs to customers
 * - Send job card PDFs to customers/staff
 * - Send OTP emails
 * - Send order confirmations
 * - Custom email templates
 *
 * Parameters:
 * - type: "sale_order" | "job_card" | "otp" | "order_confirmation" | "custom"
 * - to: Recipient email address
 * - customerName: Customer name
 * - subject: Optional custom subject
 * - pdfUrl: Optional PDF URL (for download link)
 * - pdfBase64: Optional PDF base64 content (for attachment)
 * - pdfFileName: Optional PDF file name
 * - otp: Optional OTP code
 * - orderNumber: Optional order number
 * - htmlContent: Optional custom HTML content
 * - metadata: Optional additional data
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { logEmail } from "../_shared/emailLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "sale_order" | "job_card" | "otp" | "order_confirmation" | "custom";
  to: string;
  customerName: string;
  subject?: string;
  pdfUrl?: string;
  pdfBase64?: string;
  pdfFileName?: string;
  otp?: string;
  orderNumber?: string;
  // Added IDs to request interface
  orderId?: string;
  saleOrderId?: string;
  jobCardId?: string;
  htmlContent?: string;
  metadata?: Record<string, any>;
}

// Email Templates
function getSaleOrderEmailHTML(data: {
  customerName: string;
  pdfUrl: string;
  otp?: string | null;
  orderNumber?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f6f6f6;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 2px solid #f0f0f0;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #0b0b0b;
            letter-spacing: -0.5px;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 14px 28px;
            background-color: #0b0b0b;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
          }
          .button:hover {
            background-color: #2d2d2d;
          }
          .otp-box {
            margin-top: 24px;
            padding: 24px;
            background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
            border-radius: 12px;
            text-align: center;
            border: 2px dashed #d0d0d0;
          }
          .otp-code {
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 8px;
            margin: 12px 0;
            color: #0b0b0b;
            font-family: 'Courier New', monospace;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px solid #f0f0f0;
            text-align: center;
            color: #999;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ESTRE</div>
            <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">Where Luxury Meets Comfort</p>
          </div>

          <h2 style="font-size: 24px; font-weight: 600; margin: 24px 0 12px 0; color: #0b0b0b;">
            Hello ${data.customerName},
          </h2>

          <p style="margin: 12px 0; color: #333; line-height: 1.7; font-size: 16px;">
            Your sale order has been prepared and is ready for your review.
          </p>

          ${data.orderNumber ? `
            <div style="margin: 16px 0; padding: 12px; background-color: #f9f9f9; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Order Number: <strong style="color: #0b0b0b; font-size: 16px;">${data.orderNumber}</strong>
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 28px 0;">
            <a href="${data.pdfUrl}" class="button">
              📄 Download Sale Order PDF
            </a>
          </div>

          ${data.otp ? `
            <div class="otp-box">
              <p style="margin: 0 0 8px 0; color: #666; font-size: 15px; font-weight: 600;">
                Your Confirmation OTP:
              </p>
              <p class="otp-code">${data.otp}</p>
              <p style="font-size: 13px; color: #999; margin: 8px 0 0 0;">
                ⏱️ Valid for 10 minutes
              </p>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 14px; line-height: 1.6;">
              Please enter this OTP on our website to confirm your order. This ensures the security of your transaction.
            </p>
          ` : ''}

          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #0b0b0b;">
              Thank you for choosing Estre
            </p>
            <p style="margin: 4px 0;">
              For any queries, contact us at <a href="mailto:support@estre.app" style="color: #0b0b0b;">support@estre.app</a>
            </p>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #bbb;">
              © ${new Date().getFullYear()} Estre. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getOTPEmailHTML(data: { customerName: string; otp: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f6f6f6;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .otp-box {
            margin: 24px 0;
            padding: 32px;
            background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
            border-radius: 12px;
            text-align: center;
            border: 2px dashed #d0d0d0;
          }
          .otp-code {
            font-size: 48px;
            font-weight: 700;
            letter-spacing: 10px;
            margin: 16px 0;
            color: #0b0b0b;
            font-family: 'Courier New', monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #0b0b0b;">
            Hello ${data.customerName},
          </h2>

          <p style="margin: 12px 0; color: #333; line-height: 1.7; font-size: 16px;">
            Your verification code for Estre order confirmation:
          </p>

          <div class="otp-box">
            <p style="margin: 0 0 12px 0; color: #666; font-size: 15px; font-weight: 600;">
              Verification Code:
            </p>
            <p class="otp-code">${data.otp}</p>
            <p style="font-size: 13px; color: #999; margin: 12px 0 0 0;">
              ⏱️ Expires in 10 minutes
            </p>
          </div>

          <p style="margin: 20px 0; color: #666; font-size: 14px; line-height: 1.6;">
            If you didn't request this code, please ignore this email or contact our support team.
          </p>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #f0f0f0; text-align: center; color: #999; font-size: 13px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Estre. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const requestData: EmailRequest = await req.json();

    // Validate required fields
    if (!requestData.to || !requestData.customerName || !requestData.type) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, customerName, type",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client for logging
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY not configured in environment",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare email content based on type
    let subject: string;
    let htmlContent: string;
    let attachments: any[] = [];

    switch (requestData.type) {
      case "sale_order":
        subject = requestData.subject || "Your Estre Sale Order is Ready";
        htmlContent = getSaleOrderEmailHTML({
          customerName: requestData.customerName,
          pdfUrl: requestData.pdfUrl || "",
          otp: requestData.otp,
          orderNumber: requestData.orderNumber,
        });

        // Add PDF attachment if provided
        if (requestData.pdfBase64) {
          attachments.push({
            filename: requestData.pdfFileName || `sale-order-${requestData.orderNumber || Date.now()}.pdf`,
            content: requestData.pdfBase64,
          });
        }
        break;

      case "otp":
        subject = requestData.subject || "Your Estre Verification Code";
        htmlContent = getOTPEmailHTML({
          customerName: requestData.customerName,
          otp: requestData.otp || "",
        });
        break;

      case "job_card":
        subject = requestData.subject || "Your Estre Job Card";
        htmlContent = requestData.htmlContent || `
          <h2>Hello ${requestData.customerName},</h2>
          <p>Your job card is attached.</p>
        `;

        if (requestData.pdfBase64) {
          attachments.push({
            filename: requestData.pdfFileName || `job-card-${requestData.orderNumber || Date.now()}.pdf`,
            content: requestData.pdfBase64,
          });
        }
        break;

      case "order_confirmation":
        subject = requestData.subject || "Order Confirmation - Estre";
        htmlContent = requestData.htmlContent || `
          <h2>Hello ${requestData.customerName},</h2>
          <p>Your order has been confirmed!</p>
          <p>Order Number: ${requestData.orderNumber}</p>
        `;
        break;

      case "custom":
        subject = requestData.subject || "Message from Estre";
        htmlContent = requestData.htmlContent || "";

        if (requestData.pdfBase64) {
          attachments.push({
            filename: requestData.pdfFileName || `document-${Date.now()}.pdf`,
            content: requestData.pdfBase64,
          });
        }
        break;

      default:
        throw new Error(`Unknown email type: ${requestData.type}`);
    }

    // Send email via Resend API
    const emailPayload: any = {
      from: "Estre <no-reply@estre.app>", // Updated sender
      to: requestData.to,
      subject: subject,
      html: htmlContent,
    };

    // Add attachments if any
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);

      await logEmail(supabaseClient, {
        email_type: requestData.type,
        recipient_email: requestData.to,
        recipient_name: requestData.customerName,
        subject: subject,
        status: 'failed',
        order_id: requestData.orderId,
        sale_order_id: requestData.saleOrderId,
        job_card_id: requestData.jobCardId,
        metadata: {
          ...requestData.metadata,
          orderNumber: requestData.orderNumber
        },
        error_message: `Resend API error: ${emailResponse.status} ${errorText}`,
      });

      throw new Error(`Resend API error: ${emailResponse.status} ${errorText}`);
    }

    const emailResult = await emailResponse.json();

    await logEmail(supabaseClient, {
      email_type: requestData.type,
      recipient_email: requestData.to,
      recipient_name: requestData.customerName,
      subject: subject,
      provider_message_id: emailResult.id,
      status: 'sent',
      order_id: requestData.orderId,
      sale_order_id: requestData.saleOrderId,
      job_card_id: requestData.jobCardId,
      metadata: {
        ...requestData.metadata,
        otp: requestData.otp,
        pdfUrl: requestData.pdfUrl,
        hasAttachment: attachments.length > 0,
        orderNumber: requestData.orderNumber
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        emailId: emailResult.id,
        to: requestData.to,
        type: requestData.type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send email",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

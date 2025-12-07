/**
 * Email Integration with Resend
 * 
 * Functions for sending emails related to sale orders:
 * - Sale order PDF email
 * - OTP email
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendSaleOrderEmailParams {
  to: string;
  customerName: string;
  saleOrderId: string;
  orderNumber: string;
  pdfUrl: string;
}

export interface SendOTPEmailParams {
  to: string;
  customerName: string;
  otp: string;
}

/**
 * Send sale order PDF email to customer
 */
export async function sendSaleOrderEmail({
  to,
  customerName,
  saleOrderId,
  orderNumber,
  pdfUrl,
}: SendSaleOrderEmailParams): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Email not sent.");
    return;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Estre <no-reply@estre.app>",
        to,
        subject: "Your Sale Order is Ready",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Dear ${customerName},</h2>
            <p>Your Sale Order is ready.</p>
            <p>Please review the attached PDF.</p>
            <p>To confirm, enter the OTP you will receive next.</p>
            <p style="margin-top: 20px;">
              <a href="${pdfUrl}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Download Sale Order PDF
              </a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Order Number: ${orderNumber}
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `sale-order-${orderNumber}.pdf`,
            path: pdfUrl,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    }
  } catch (error) {
    console.error("Error sending sale order email:", error);
    throw error;
  }
}

/**
 * Send OTP email to customer
 */
export async function sendOTPEmail({
  to,
  customerName,
  otp,
}: SendOTPEmailParams): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Email not sent.");
    return;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Estre <no-reply@estre.app>",
        to,
        subject: "Your Estre Order Confirmation OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Dear ${customerName},</h2>
            <p>Your Estre Order Confirmation OTP: <strong style="font-size: 24px; color: #22c55e;">${otp}</strong></p>
            <p>Valid for 10 minutes.</p>
            <p>Please enter this OTP to confirm your order.</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you didn't request this OTP, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    }
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}


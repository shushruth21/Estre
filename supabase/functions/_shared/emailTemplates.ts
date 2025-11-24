/**
 * Email Template: Sale Order Approved
 * Simple HTML template (no React Email dependency - works in Deno)
 */

export function saleOrderApprovedEmailHTML({ 
  customerName, 
  pdfUrl, 
  otp,
  orderNumber 
}: { 
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
            padding: 28px; 
            border-radius: 12px; 
          }
          .button { 
            display: inline-block; 
            margin-top: 18px; 
            padding: 12px 18px; 
            background-color: #0b0b0b; 
            color: #ffffff; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 500; 
          }
          .otp-box { 
            margin-top: 20px; 
            padding: 20px; 
            background-color: #f9f9f9; 
            border-radius: 8px; 
            text-align: center; 
          }
          .otp-code { 
            font-size: 36px; 
            font-weight: 700; 
            letter-spacing: 4px; 
            margin: 10px 0; 
            color: #0b0b0b; 
            font-family: monospace; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0; color: #0b0b0b;">
            Hello ${customerName},
          </h2>
          <p style="margin: 8px 0; color: #333; line-height: 1.6;">
            Your sale order has been approved by Estre staff.
          </p>
          ${orderNumber ? `<p style="margin: 8px 0; color: #666; font-size: 14px;">Order Number: <strong>${orderNumber}</strong></p>` : ''}
          <a href="${pdfUrl}" class="button">
            Download Sale Order PDF
          </a>
          ${otp ? `
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your confirmation OTP:</p>
              <p class="otp-code">${otp}</p>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">
                OTP expires in 10 minutes.
              </p>
            </div>
          ` : ''}
          <p style="margin-top: 30px; color: #666; line-height: 1.6;">
            Thank you for choosing Estre.<br>
            <em style="color: #999;">Where Luxury Meets Comfort.</em>
          </p>
        </div>
      </body>
    </html>
  `;
}


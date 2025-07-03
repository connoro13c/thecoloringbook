import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface DonationReceiptData {
  userEmail: string;
  userName?: string;
  amount: number; // Amount in cents
  donationDate: string;
  stripeSessionId: string;
  pageId: string;
}

/**
 * Send IRS-compliant tax-deductible donation receipt
 */
export async function sendDonationReceipt(data: DonationReceiptData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ SendGrid API key not configured, skipping email');
    return;
  }

  try {
    const formattedAmount = (data.amount / 100).toFixed(2);
    const formattedDate = new Date(data.donationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailContent = {
      to: data.userEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'donations@thecoloringbook.com',
        name: 'The Coloring Book Foundation'
      },
      subject: 'Your Tax-Deductible Donation Receipt – The Coloring Book',
      html: generateReceiptHTML(data, formattedAmount, formattedDate),
      text: generateReceiptText(data, formattedAmount, formattedDate),
    };

    await sgMail.send(emailContent);
    console.log(`✅ Donation receipt sent to ${data.userEmail}`);

  } catch (error) {
    console.error('❌ Failed to send donation receipt:', error);
    // Don't throw error to avoid breaking the payment flow
    // The user will still get Stripe's receipt
  }
}

/**
 * Generate HTML content for donation receipt
 */
function generateReceiptHTML(
  data: DonationReceiptData, 
  formattedAmount: string, 
  formattedDate: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Donation Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #5B6ABF 0%, #D98994 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
        .receipt-box { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #5B6ABF; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { color: #5B6ABF; font-weight: bold; }
        .amount { font-size: 24px; color: #2d5a27; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎨 Thank You for Your Donation!</h1>
        <p>Supporting children's creativity and learning</p>
      </div>
      
      <div class="content">
        <p>Dear ${data.userName || 'Friend'},</p>
        
        <p>Thank you for your generous donation to The Coloring Book Foundation. Your support helps us create magical, personalized coloring experiences for children everywhere.</p>
        
        <div class="receipt-box">
          <h3>📋 Official Donation Receipt</h3>
          <p><strong>Donation Amount:</strong> <span class="amount">$${formattedAmount}</span></p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Transaction ID:</strong> ${data.stripeSessionId}</p>
          <p><strong>Page ID:</strong> ${data.pageId}</p>
        </div>
        
        <div class="receipt-box">
          <h3>📄 Tax Information</h3>
          <p><strong>Organization:</strong> The Coloring Book Foundation</p>
          <p><strong>EIN:</strong> 12-3456789 <em>(Example - Update with real EIN)</em></p>
          <p><strong>Donation Type:</strong> Charitable Contribution</p>
          <p><strong>Goods/Services Provided:</strong> No goods or services were provided in return for this contribution.</p>
        </div>
        
        <p><strong>🏛️ IRS Compliance Notice:</strong> This letter serves as your official receipt for tax purposes. Please keep this record for your tax filings as required by the Internal Revenue Service.</p>
        
        <p>Your high-resolution coloring page files are now available in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/library" style="color: #5B6ABF;">personal library</a>.</p>
        
        <p>Thank you again for supporting our mission to bring joy and creativity to children through personalized coloring experiences!</p>
        
        <p>With gratitude,<br>
        <strong>The Coloring Book Foundation Team</strong></p>
      </div>
      
      <div class="footer">
        <p>The Coloring Book Foundation | thecoloringbook.com</p>
        <p>This email was sent regarding your donation. If you have questions, please contact support@thecoloringbook.com</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text content for donation receipt
 */
function generateReceiptText(
  data: DonationReceiptData, 
  formattedAmount: string, 
  formattedDate: string
): string {
  return `
OFFICIAL DONATION RECEIPT
The Coloring Book Foundation

Dear ${data.userName || 'Friend'},

Thank you for your generous donation of $${formattedAmount} on ${formattedDate}.

DONATION DETAILS:
- Amount: $${formattedAmount}
- Date: ${formattedDate}
- Transaction ID: ${data.stripeSessionId}
- Page ID: ${data.pageId}

TAX INFORMATION:
- Organization: The Coloring Book Foundation
- EIN: 12-3456789 (Example - Update with real EIN)
- Donation Type: Charitable Contribution
- No goods or services were provided in return for this contribution.

IRS COMPLIANCE NOTICE:
This letter serves as your official receipt for tax purposes. Please keep this record for your tax filings as required by the Internal Revenue Service.

Your high-resolution coloring page files are now available in your personal library at: ${process.env.NEXT_PUBLIC_APP_URL}/library

Thank you for supporting our mission to bring joy and creativity to children!

With gratitude,
The Coloring Book Foundation Team

---
The Coloring Book Foundation | thecoloringbook.com
If you have questions, please contact support@thecoloringbook.com
  `.trim();
}

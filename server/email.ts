import nodemailer from 'nodemailer';

export interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface IncidentEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  employeeName: string;
  incidentDescription: string;
  witnessName?: string;
  witnessPhone?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleLicensePlate: string;
  damageDescription: string;
  additionalNotes?: string;
}

export function createEmailTransporter(): nodemailer.Transporter | null {
  const emailService = process.env.EMAIL_SERVICE;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;

  if (!emailUser || !emailPassword) {
    console.log('Email credentials not configured');
    return null;
  }

  let config: EmailConfig = {
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  };

  if (emailService) {
    config.service = emailService;
  } else if (emailHost) {
    config.host = emailHost;
    config.port = emailPort ? parseInt(emailPort) : 587;
    config.secure = config.port === 465;
  } else {
    console.log('Email service or host not configured');
    return null;
  }

  try {
    return nodemailer.createTransport(config);
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
}

export function formatIncidentEmailHtml(data: IncidentEmailData): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #007bff; }
          .content { padding: 20px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
          .field { margin-bottom: 10px; }
          .field-label { font-weight: bold; color: #555; }
          .field-value { margin-left: 10px; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 INCIDENT REPORT SUBMITTED</h1>
          <p>Access Valet Parking - Incident Notification</p>
        </div>
        
        <div class="content">
          <div class="alert">
            <strong>Action Required:</strong> A new incident report has been submitted and requires immediate attention.
          </div>

          <div class="section">
            <h3>Customer Information</h3>
            <div class="field">
              <span class="field-label">Name:</span>
              <span class="field-value">${data.customerName}</span>
            </div>
            <div class="field">
              <span class="field-label">Email:</span>
              <span class="field-value">${data.customerEmail}</span>
            </div>
            <div class="field">
              <span class="field-label">Phone:</span>
              <span class="field-value">${data.customerPhone}</span>
            </div>
          </div>

          <div class="section">
            <h3>Incident Details</h3>
            <div class="field">
              <span class="field-label">Date:</span>
              <span class="field-value">${data.incidentDate}</span>
            </div>
            <div class="field">
              <span class="field-label">Time:</span>
              <span class="field-value">${data.incidentTime}</span>
            </div>
            <div class="field">
              <span class="field-label">Location:</span>
              <span class="field-value">${data.incidentLocation}</span>
            </div>
            <div class="field">
              <span class="field-label">Employee Involved:</span>
              <span class="field-value">${data.employeeName}</span>
            </div>
            <div class="field">
              <span class="field-label">Description:</span>
              <div class="field-value" style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px;">
                ${data.incidentDescription.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Vehicle Information</h3>
            <div class="field">
              <span class="field-label">Make:</span>
              <span class="field-value">${data.vehicleMake}</span>
            </div>
            <div class="field">
              <span class="field-label">Model:</span>
              <span class="field-value">${data.vehicleModel}</span>
            </div>
            <div class="field">
              <span class="field-label">Year:</span>
              <span class="field-value">${data.vehicleYear}</span>
            </div>
            <div class="field">
              <span class="field-label">Color:</span>
              <span class="field-value">${data.vehicleColor}</span>
            </div>
            <div class="field">
              <span class="field-label">License Plate:</span>
              <span class="field-value">${data.vehicleLicensePlate}</span>
            </div>
            <div class="field">
              <span class="field-label">Damage Description:</span>
              <div class="field-value" style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px;">
                ${data.damageDescription.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>

          ${data.witnessName ? `
          <div class="section">
            <h3>Witness Information</h3>
            <div class="field">
              <span class="field-label">Witness Name:</span>
              <span class="field-value">${data.witnessName}</span>
            </div>
            ${data.witnessPhone ? `
            <div class="field">
              <span class="field-label">Witness Phone:</span>
              <span class="field-value">${data.witnessPhone}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${data.additionalNotes ? `
          <div class="section">
            <h3>Additional Notes</h3>
            <div class="field-value" style="background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
              ${data.additionalNotes.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h3>Next Steps</h3>
            <ul>
              <li>Review incident details immediately</li>
              <li>Contact customer within 24 hours</li>
              <li>Follow up with employee involved</li>
              <li>Document any additional findings</li>
              <li>Update insurance if necessary</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendIncidentNotification(data: IncidentEmailData): Promise<boolean> {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.error('Email transporter not available');
    return false;
  }

  const htmlContent = formatIncidentEmailHtml(data);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'brandon@accessvaletparking.com',
    subject: `🚨 URGENT: Incident Report - ${data.incidentLocation} - ${data.incidentDate}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Incident notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send incident notification email:', error);
    return false;
  }
}

export interface CustomerConfirmationData {
  customerName: string;
  customerEmail: string;
  claimNumber: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
}

export function formatCustomerConfirmationEmail(data: CustomerConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Incident Report Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #ff6b35;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #ff6b35;
          margin-bottom: 10px;
        }
        .claim-number {
          background-color: #ff6b35;
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-size: 18px;
          font-weight: bold;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          color: #ff6b35;
          border-bottom: 2px solid #ff6b35;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .field {
          margin-bottom: 10px;
          display: flex;
          flex-wrap: wrap;
        }
        .field-label {
          font-weight: bold;
          min-width: 120px;
          color: #555;
        }
        .field-value {
          flex: 1;
          color: #333;
        }
        .contact-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #ff6b35;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">Access Valet Parking</div>
          <h2>Incident Report Confirmation</h2>
        </div>

        <p>Dear ${data.customerName},</p>
        
        <p>Thank you for submitting an incident report. We have received your report and it has been assigned the following claim number:</p>

        <div class="claim-number">
          Claim #${data.claimNumber}
        </div>

        <div class="section">
          <h3>Report Summary</h3>
          <div class="field">
            <span class="field-label">Date:</span>
            <span class="field-value">${data.incidentDate}</span>
          </div>
          <div class="field">
            <span class="field-label">Time:</span>
            <span class="field-value">${data.incidentTime}</span>
          </div>
          <div class="field">
            <span class="field-label">Location:</span>
            <span class="field-value">${data.incidentLocation}</span>
          </div>
        </div>

        <div class="section">
          <h3>What Happens Next?</h3>
          <ul>
            <li>Our team will review your incident report within 24 hours</li>
            <li>We will contact you directly to discuss next steps</li>
            <li>Please keep your claim number for reference: <strong>${data.claimNumber}</strong></li>
            <li>If you have any questions, please contact us using the information below</li>
          </ul>
        </div>

        <div class="contact-info">
          <h3 style="margin-top: 0; color: #ff6b35;">Contact Information</h3>
          <div class="field">
            <span class="field-label">Company:</span>
            <span class="field-value">Access Valet Parking</span>
          </div>
          <div class="field">
            <span class="field-label">Phone:</span>
            <span class="field-value">512-934-4859</span>
          </div>
          <div class="field">
            <span class="field-label">Email:</span>
            <span class="field-value">ryan@accessvaletparking.com</span>
          </div>
          <div class="field">
            <span class="field-label">Address:</span>
            <span class="field-value">Austin, Texas</span>
          </div>
        </div>

        <p>We appreciate your patience and understanding. Our goal is to resolve this matter promptly and professionally.</p>

        <div class="footer">
          <p>© 2025 Access Valet Parking. All rights reserved.</p>
          <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendCustomerConfirmation(data: CustomerConfirmationData): Promise<boolean> {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.error('Email transporter not available for customer confirmation');
    return false;
  }

  const htmlContent = formatCustomerConfirmationEmail(data);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: data.customerEmail,
    subject: `Incident Report Confirmation - Claim #${data.claimNumber}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Customer confirmation email sent to ${data.customerEmail} for claim #${data.claimNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send customer confirmation email:', error);
    return false;
  }
}
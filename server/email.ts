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
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    let pass = process.env.EMAIL_PASS;

    // Use the correct Gmail App Password if needed
    if (pass && pass.includes(' ')) {
      pass = pass.replace(/\s/g, '');
    }
    
    // If EMAIL_PASS is still the old format, use the correct app password
    if (pass === 'aynw mvuj ysfw corv' || pass === 'aynwmvujysfwcorv' || pass?.length < 16) {
      pass = 'aynwmvujysfwcorv';
    }

    if (user && pass) {
      this.config = {
        host,
        port,
        secure: port === 465,
        user,
        pass
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      });

      console.log('[EMAIL] Email service initialized successfully');
    } else {
      console.log('[EMAIL] Email credentials not found - email notifications disabled');
    }
  }

  public isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  public async sendHelpRequestNotification(
    toEmail: string,
    locationName: string,
    attendantsNeeded: number,
    urgencyLevel: string,
    appUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[EMAIL] Skipping email - service not configured');
      return false;
    }

    try {
      const urgencyEmoji = urgencyLevel === 'urgent' ? '🚨' : '📢';
      const subject = `${urgencyEmoji} Help Request: ${locationName} Needs Assistance`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706; margin-bottom: 20px;">${urgencyEmoji} Valet Help Request</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Location: ${locationName}</h3>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>Attendants Needed:</strong> ${attendantsNeeded}<br>
              <strong>Priority:</strong> ${urgencyLevel.toUpperCase()}<br>
              <strong>Time:</strong> ${new Date().toLocaleTimeString()}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/help-request" 
               style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Respond to Help Request
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Click the button above or visit: <a href="${appUrl}/help-request">${appUrl}/help-request</a>
          </p>
        </div>
      `;

      const result = await this.transporter!.sendMail({
        from: this.config!.user,
        to: toEmail,
        subject,
        html,
      });

      console.log(`[EMAIL] Help request notification sent to ${toEmail}, ID: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`[EMAIL] Failed to send notification to ${toEmail}:`, error);
      return false;
    }
  }

  public async sendHelpResponseNotification(
    toEmail: string,
    responderLocation: string,
    requestingLocation: string,
    responseMessage: string,
    appUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[EMAIL] Skipping email - service not configured');
      return false;
    }

    try {
      const subject = `✅ Help Response: ${responderLocation} Responded`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669; margin-bottom: 20px;">✅ Help Response Received</h2>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">From: ${responderLocation}</h3>
            <h4 style="color: #6b7280; margin: 10px 0;">To: ${requestingLocation}</h4>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
              <p style="margin: 0; color: #374151;">"${responseMessage}"</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/help-request" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Help Center
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Visit: <a href="${appUrl}/help-request">${appUrl}/help-request</a>
          </p>
        </div>
      `;

      const result = await this.transporter!.sendMail({
        from: this.config!.user,
        to: toEmail,
        subject,
        html,
      });

      console.log(`[EMAIL] Help response notification sent to ${toEmail}, ID: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`[EMAIL] Failed to send response notification to ${toEmail}:`, error);
      return false;
    }
  }

  // Email-to-SMS gateway support for major carriers
  public static getEmailToSMS(phoneNumber: string, carrier: string): string | null {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const gateways: { [key: string]: string } = {
      'verizon': '@vtext.com',
      'att': '@txt.att.net',
      'tmobile': '@tmomail.net',
      'sprint': '@messaging.sprintpcs.com',
      'usccellular': '@email.uscc.net',
      'boost': '@smsmyboostmobile.com',
      'cricket': '@sms.cricketwireless.net',
      'metropcs': '@mymetropcs.com'
    };

    const gateway = gateways[carrier.toLowerCase()];
    return gateway ? `${cleanPhone}${gateway}` : null;
  }
}

// Export singleton instance
export const emailService = new EmailService();
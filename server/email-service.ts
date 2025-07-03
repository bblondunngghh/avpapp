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
    if (pass === 'aynw mvuj ysfw corv' || pass === 'aynwmvujysfwcorv' || (pass && pass.length < 16)) {
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

  // Send to multiple SMS gateways simultaneously for better delivery
  public async sendSMSToAllGateways(
    phoneNumber: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const gateways = [
      `${cleanPhone}@vtext.com`,      // Verizon
      `${cleanPhone}@txt.att.net`,    // AT&T
      `${cleanPhone}@tmomail.net`,    // T-Mobile
      `${cleanPhone}@messaging.sprintpcs.com`, // Sprint
      `${cleanPhone}@mymetropcs.com`, // Metro
      `${cleanPhone}@textmsg.com`,    // T-Mobile Alt
      `${cleanPhone}@email.uscc.net`, // US Cellular
      `${cleanPhone}@sms.cricketwireless.net` // Cricket
    ];

    const promises = gateways.map(async (gateway) => {
      try {
        const result = await this.transporter!.sendMail({
          from: this.config!.user,
          to: gateway,
          subject,
          text: message,
        });
        console.log(`[EMAIL] SMS sent to ${gateway}, ID: ${result.messageId}`);
        return true;
      } catch (error) {
        console.log(`[EMAIL] Failed to send to ${gateway}`);
        return false;
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`[EMAIL] SMS sent to ${successCount}/${gateways.length} gateways for ${cleanPhone}`);
    return successCount > 0;
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
      // Check if this is an SMS gateway or phone number
      const isSMSGateway = toEmail.includes('@') && (
        toEmail.includes('vtext.com') || 
        toEmail.includes('txt.att.net') ||
        toEmail.includes('tmomail.net') ||
        toEmail.includes('messaging.sprintpcs.com') ||
        toEmail.includes('msg.fi.google.com') ||
        toEmail.includes('mymetropcs.com') ||
        toEmail.includes('textmsg.com') ||
        toEmail.includes('email.uscc.net') ||
        toEmail.includes('sms.cricketwireless.net')
      );

      // Check if it's just a phone number
      const phonePattern = /^\d{10}$/;
      const isPhoneNumber = phonePattern.test(toEmail.replace(/\D/g, ''));

      if (isSMSGateway || isPhoneNumber) {
        const urgencyText = urgencyLevel === 'urgent' ? 'URGENT' : 'HELP';
        const plainTextMessage = `${urgencyText}: ${locationName} needs valet assistance. ${attendantsNeeded} attendant(s) needed. Respond at ${appUrl}/help-request`;
        const subject = `${urgencyText}: ${locationName} Help Request`;
        
        if (isPhoneNumber) {
          // Send to all gateways simultaneously
          return await this.sendSMSToAllGateways(toEmail, subject, plainTextMessage);
        } else {
          // Extract phone and send to all gateways
          const phoneMatch = toEmail.match(/^(\d+)@/);
          if (phoneMatch) {
            return await this.sendSMSToAllGateways(phoneMatch[1], subject, plainTextMessage);
          }
          
          // Fallback for direct gateway email
          const result = await this.transporter!.sendMail({
            from: this.config!.user,
            to: toEmail,
            subject,
            text: plainTextMessage,
          });

          console.log(`[EMAIL] SMS notification sent to ${toEmail}, ID: ${result.messageId}`);
          return true;
        }
      } else {
        // HTML email for regular email addresses
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
      }
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
      // Check if this is an SMS gateway (contains carrier domains)
      const isSMSGateway = toEmail.includes('@tmomail.net') || 
                          toEmail.includes('@vtext.com') || 
                          toEmail.includes('@txt.att.net') ||
                          toEmail.includes('@messaging.sprintpcs.com') ||
                          toEmail.includes('@msg.fi.google.com') ||
                          toEmail.includes('@mymetropcs.com') ||
                          toEmail.includes('@textmsg.com');

      if (isSMSGateway) {
        // Extract phone number and try multiple gateways if needed
        const phoneMatch = toEmail.match(/^(\d+)@/);
        if (phoneMatch) {
          const phoneNumber = phoneMatch[1];
          const fallbackGateways = [
            toEmail, // Try original first
            `${phoneNumber}@vtext.com`, // Verizon (most reliable)
            `${phoneNumber}@txt.att.net`, // AT&T
            `${phoneNumber}@textmsg.com`, // T-Mobile backup
            `${phoneNumber}@mymetropcs.com` // Metro/T-Mobile backup
          ];

          for (const gateway of fallbackGateways) {
            try {
              const plainTextMessage = `RESPONSE: ${responderLocation} responded to ${requestingLocation} help request: "${responseMessage}" - View updates at ${appUrl}/help-request`;
              
              const result = await this.transporter!.sendMail({
                from: this.config!.user,
                to: gateway,
                subject: `RESPONSE: ${responderLocation} Responded`,
                text: plainTextMessage,
              });

              console.log(`[EMAIL] SMS response notification sent to ${gateway}, ID: ${result.messageId}`);
              return true;
            } catch (error) {
              console.log(`[EMAIL] Gateway ${gateway} failed, trying next...`);
              continue;
            }
          }
          
          console.error(`[EMAIL] All SMS gateways failed for ${phoneNumber}`);
          return false;
        }
        
        // Fallback to original logic if phone extraction fails
        const plainTextMessage = `RESPONSE: ${responderLocation} responded to ${requestingLocation} help request: "${responseMessage}" - View updates at ${appUrl}/help-request`;
        
        const result = await this.transporter!.sendMail({
          from: this.config!.user,
          to: toEmail,
          subject: `RESPONSE: ${responderLocation} Responded`,
          text: plainTextMessage,
        });

        console.log(`[EMAIL] SMS response notification sent to ${toEmail}, ID: ${result.messageId}`);
        return true;
      } else {
        // HTML email for regular email addresses
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
      }
    } catch (error) {
      console.error(`[EMAIL] Failed to send response notification to ${toEmail}:`, error);
      return false;
    }
  }

  // Email-to-SMS gateway support for major carriers
  public static getEmailToSMS(phoneNumber: string, carrier: string): string | null {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const gateways: { [key: string]: string[] } = {
      'verizon': ['@vtext.com', '@vzwpix.com'],
      'att': ['@txt.att.net', '@mms.att.net'],
      'tmobile': ['@tmomail.net', '@msg.fi.google.com', '@mymetropcs.com', '@textmsg.com'],
      'sprint': ['@messaging.sprintpcs.com', '@pm.sprint.com'],
      'usccellular': ['@email.uscc.net'],
      'boost': ['@smsmyboostmobile.com', '@myboostmobile.com'],
      'cricket': ['@sms.cricketwireless.net'],
      'metropcs': ['@mymetropcs.com']
    };

    const carrierGateways = gateways[carrier.toLowerCase()];
    return carrierGateways ? `${cleanPhone}${carrierGateways[0]}` : null;
  }

  // Test multiple T-Mobile gateways
  public async testTMobileGateways(phoneNumber: string): Promise<string | null> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const tmobileGateways = [
      '@msg.fi.google.com',
      '@mymetropcs.com', 
      '@tmomail.net',
      '@textmsg.com'
    ];

    for (const gateway of tmobileGateways) {
      const testEmail = `${cleanPhone}${gateway}`;
      console.log(`[EMAIL] Testing T-Mobile gateway: ${testEmail}`);
      
      try {
        const result = await this.transporter!.sendMail({
          from: this.config!.user,
          to: testEmail,
          subject: 'SMS Gateway Test',
          text: 'Testing T-Mobile SMS gateway - if you receive this, reply with the gateway name.'
        });
        
        console.log(`[EMAIL] Test sent to ${testEmail}, ID: ${result.messageId}`);
        // Return the first successful gateway
        return gateway;
      } catch (error) {
        console.error(`[EMAIL] Failed to send to ${testEmail}:`, error);
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const emailService = new EmailService();
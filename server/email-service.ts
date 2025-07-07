import nodemailer from 'nodemailer';
import { getEnvironmentConfig, validateEmailConfig } from './environment-config';

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
  private employeeEmailsEnabled: boolean = false; // Temporarily disabled for bulk updates

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const envConfig = getEnvironmentConfig();
      
      // Validate email configuration
      if (!validateEmailConfig(envConfig)) {
        console.log('[EMAIL] Email service disabled - invalid configuration');
        return;
      }

      this.config = {
        host: envConfig.emailHost,
        port: envConfig.emailPort,
        secure: envConfig.emailPort === 465,
        user: envConfig.emailUser,
        pass: envConfig.emailPass
      };

      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      });

      console.log('[EMAIL] Email service initialized successfully');
    } catch (error) {
      console.error('[EMAIL] Failed to initialize email service:', error);
      console.log('[EMAIL] Email notifications disabled');
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
        
        let targetGateway: string;
        
        if (isPhoneNumber) {
          // Use single reliable gateway - T-Mobile
          const cleanPhone = toEmail.replace(/\D/g, '');
          targetGateway = `${cleanPhone}@tmomail.net`;
        } else {
          // Use the provided gateway email
          targetGateway = toEmail;
        }
        
        const result = await this.transporter!.sendMail({
          from: this.config!.user,
          to: targetGateway,
          subject,
          text: plainTextMessage,
        });

        console.log(`[EMAIL] SMS notification sent to ${targetGateway}, ID: ${result.messageId}`);
        return true;
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

  public async sendNewEmployeeNotification(
    employeeName: string,
    dateOfBirth: string,
    driverLicense: string,
    socialSecurityNumber: string
  ): Promise<boolean> {
    if (!this.employeeEmailsEnabled) {
      console.log('[EMAIL] Skipping new employee notification - temporarily disabled for bulk updates');
      return false;
    }

    if (!this.isConfigured()) {
      console.log('[EMAIL] Skipping email - service not configured');
      return false;
    }

    try {
      const accountantEmails = ['brandon@accessvaletparking.com', 'hkeirstead1947@gmail.com'];
      const subject = 'New Employee Added - QuickBooks Entry Required';
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">📋 New Employee Added to System</h2>
          
          <p style="color: #374151; margin-bottom: 20px;">
            A new employee has been added to the Access Valet Parking system and requires entry into QuickBooks for payroll processing.
          </p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1f2937;">Employee Information:</h3>
            <table style="width: 100%; border-spacing: 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 30%;">Full Name:</td>
                <td style="padding: 8px 0; color: #1f2937;">${employeeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date of Birth:</td>
                <td style="padding: 8px 0; color: #1f2937;">${dateOfBirth}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">TX Driver License:</td>
                <td style="padding: 8px 0; color: #1f2937;">${driverLicense}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Social Security Number:</td>
                <td style="padding: 8px 0; color: #1f2937;">${socialSecurityNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Action Required:</strong> Please add this employee to QuickBooks for payroll processing.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
            This notification was automatically generated by the Access Valet Parking management system.
          </p>
        </div>
      `;

      const result = await this.transporter!.sendMail({
        from: this.config!.user,
        to: accountantEmails.join(', '),
        subject,
        html,
      });

      console.log(`[EMAIL] New employee notification sent to ${accountantEmails.join(', ')}, ID: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`[EMAIL] Failed to send new employee notification:`, error);
      return false;
    }
  }

  public async sendAllEmployeesReport(employees: any[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[EMAIL] Skipping email - service not configured');
      return false;
    }

    try {
      const subject = 'Access Valet Parking - 2025 Employee Report';
      const currentDate = new Date().toLocaleDateString();
      
      // Calculate summary statistics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(emp => emp.active).length;
      const shiftLeaders = employees.filter(emp => emp.isShiftLeader).length;
      
      // Create employee table rows
      const employeeRows = employees.map(emp => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #374151;">${emp.fullName}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${emp.dateOfBirth || 'N/A'}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${emp.driverLicense || 'N/A'}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${emp.fullSsn || 'N/A'}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${emp.phone || 'N/A'}</td>
          <td style="padding: 12px 8px;">
            <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${emp.active ? '#dcfce7' : '#fee2e2'}; color: ${emp.active ? '#166534' : '#dc2626'};">
              ${emp.active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td style="padding: 12px 8px; text-align: center;">
            ${emp.isShiftLeader ? '⭐' : ''}
          </td>
        </tr>
      `).join('');
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #1f2937; margin-bottom: 20px; text-align: center;">Access Valet Parking</h1>
          <h2 style="color: #374151; margin-bottom: 30px; text-align: center;">2025 Employee Report</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin-top: 0; color: #1f2937;">Report Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalEmployees}</div>
                <div style="color: #6b7280;">Total Employees</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #059669;">${activeEmployees}</div>
                <div style="color: #6b7280;">Active Employees</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #d97706;">${shiftLeaders}</div>
                <div style="color: #6b7280;">Shift Leaders</div>
              </div>
            </div>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600;">Full Name</th>
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600;">Date of Birth</th>
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600;">Driver License</th>
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600;">SSN</th>
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600;">Phone</th>
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600;">Status</th>
                  <th style="padding: 12px 8px; text-align: center; color: #374151; font-weight: 600;">Leader</th>
                </tr>
              </thead>
              <tbody>
                ${employeeRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Note:</strong> This report contains sensitive employee information. Please handle according to company privacy policies.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
            Generated on ${currentDate} by Access Valet Parking Management System
          </p>
        </div>
      `;

      const result = await this.transporter!.sendMail({
        from: this.config!.user,
        to: 'brandon@accessvaletparking.com',
        subject,
        html,
      });

      console.log(`[EMAIL] 2025 employee report sent to brandon@accessvaletparking.com, ID: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`[EMAIL] Failed to send employee report:`, error);
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

  public enableEmployeeEmails(): void {
    this.employeeEmailsEnabled = true;
    console.log('[EMAIL] Employee email notifications re-enabled');
  }

  public disableEmployeeEmails(): void {
    this.employeeEmailsEnabled = false;
    console.log('[EMAIL] Employee email notifications disabled');
  }
}

export const emailService = new EmailService();
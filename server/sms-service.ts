import twilio from 'twilio';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class SMSService {
  private client: twilio.Twilio | null = null;
  private config: SMSConfig | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (accountSid && authToken && fromNumber) {
      this.config = { accountSid, authToken, fromNumber };
      this.client = twilio(accountSid, authToken);
      console.log('[SMS] Twilio client initialized successfully');
    } else {
      console.log('[SMS] Twilio credentials not found - SMS notifications disabled');
    }
  }

  public isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  public async sendHelpRequestNotification(
    toNumber: string,
    locationName: string,
    attendantsNeeded: number,
    urgencyLevel: string,
    appUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[SMS] Skipping SMS - service not configured');
      return false;
    }

    try {
      const urgencyEmoji = urgencyLevel === 'urgent' ? '🚨' : '📢';
      const message = `${urgencyEmoji} HELP REQUEST: ${locationName} needs ${attendantsNeeded} valet attendant${attendantsNeeded > 1 ? 's' : ''} (${urgencyLevel}). Respond here: ${appUrl}/help-request - Sent at ${new Date().toLocaleTimeString()}`;

      const result = await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: toNumber
      });

      console.log(`[SMS] Help request notification sent to ${toNumber}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`[SMS] Failed to send notification to ${toNumber}:`, error);
      return false;
    }
  }

  public async sendHelpResponseNotification(
    toNumber: string,
    responderLocation: string,
    requestingLocation: string,
    responseMessage: string,
    appUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[SMS] Skipping SMS - service not configured');
      return false;
    }

    try {
      const message = `✅ HELP RESPONSE: ${responderLocation} responded to ${requestingLocation}: "${responseMessage}" - View details: ${appUrl}/help-request`;

      const result = await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: toNumber
      });

      console.log(`[SMS] Help response notification sent to ${toNumber}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`[SMS] Failed to send response notification to ${toNumber}:`, error);
      return false;
    }
  }

  public async sendCoverCountAlert(
    toNumber: string,
    locationName: string,
    coverCount: number,
    shift: string,
    appUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[SMS] Skipping SMS - service not configured');
      return false;
    }

    try {
      const statusEmoji = coverCount > 200 ? '🔥' : coverCount > 100 ? '⚠️' : '📊';
      const status = coverCount > 200 ? 'BUSY' : coverCount > 100 ? 'AVERAGE' : 'SLOW';
      
      const message = `${statusEmoji} COVER COUNT: ${locationName} ${shift} - ${coverCount} covers (${status}). View report: ${appUrl}/cover-count - ${new Date().toLocaleTimeString()}`;

      const result = await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: toNumber
      });

      console.log(`[SMS] Cover count alert sent to ${toNumber}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`[SMS] Failed to send cover count alert to ${toNumber}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const smsService = new SMSService();
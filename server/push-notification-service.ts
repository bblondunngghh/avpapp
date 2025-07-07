import webpush from 'web-push';
import { getEnvironmentConfig, validateVapidConfig } from './environment-config';

// Push Notification Service using Web Push API
export class PushNotificationService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidEmail: string;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeVapidKeys();
  }

  private initializeVapidKeys() {
    try {
      const envConfig = getEnvironmentConfig();
      
      // Validate VAPID configuration
      if (!validateVapidConfig(envConfig)) {
        console.log('[PUSH] Push notification service disabled - invalid VAPID configuration');
        return;
      }

      this.vapidPublicKey = envConfig.vapidPublicKey;
      this.vapidPrivateKey = envConfig.vapidPrivateKey;
      this.vapidEmail = envConfig.vapidEmail;

      // Configure VAPID details for web-push
      webpush.setVapidDetails(
        `mailto:${this.vapidEmail}`,
        this.vapidPublicKey,
        this.vapidPrivateKey
      );

      this.isConfigured = true;
      console.log('[PUSH] Web push service initialized with VAPID keys');
    } catch (error) {
      console.error('[PUSH] Failed to initialize push notification service:', error);
      console.log('[PUSH] Push notifications disabled');
    }
  }

  public getVapidPublicKey(): string | null {
    return this.isConfigured ? this.vapidPublicKey : null;
  }

  public async sendHelpRequestNotification(
    subscriptions: any[],
    locationName: string,
    attendantsNeeded: number,
    urgencyLevel: string,
    appUrl: string
  ): Promise<void> {
    if (subscriptions.length === 0) {
      console.log('[PUSH] No push subscriptions available');
      return;
    }

    const urgencyText = urgencyLevel === 'urgent' ? '🚨 URGENT' : '📢 HELP';
    const title = `${urgencyText}: Help Request`;
    const body = `${locationName} needs ${attendantsNeeded} valet attendant(s). Tap to respond.`;
    
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: `${appUrl}/help-request`,
      tag: 'help-request',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Request'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        url: `${appUrl}/help-request`,
        locationName,
        urgencyLevel,
        timestamp: Date.now()
      }
    });

    // Send to all active subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        console.log(`[PUSH] ✓ Notification sent to: ${subscription.endpoint.slice(0, 50)}...`);
        return true;
      } catch (error: any) {
        console.error(`[PUSH] ✗ Failed to send to subscription ${subscription.id}:`, error);
        // Handle expired subscriptions
        if (error.statusCode === 410) {
          console.log(`[PUSH] Subscription expired, should remove: ${subscription.endpoint.slice(0, 50)}...`);
        }
        return false;
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`[PUSH] Sent notifications to ${successCount}/${subscriptions.length} subscribers`);
  }

  public async sendCoverCountReminder(subscriptions: any[]): Promise<void> {
    if (subscriptions.length === 0) {
      console.log('[PUSH] No push subscriptions for cover count reminder');
      return;
    }

    const title = '📊 Daily Cover Count Report';
    const body = 'Don\'t forget to submit your 5:00 PM cover count report for today.';
    
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: '/help-request',
      tag: 'cover-count-reminder',
      requireInteraction: false,
      data: {
        url: '/help-request',
        type: 'cover-count-reminder',
        timestamp: Date.now()
      }
    });

    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        console.log(`[PUSH] ✓ Cover count reminder sent to: ${subscription.endpoint.slice(0, 50)}...`);
        return true;
      } catch (error: any) {
        console.error(`[PUSH] ✗ Failed to send cover count reminder:`, error);
        return false;
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`[PUSH] Sent cover count reminders to ${successCount}/${subscriptions.length} subscribers`);
  }

  // Simulate push notification for demo purposes
  public async simulatePushNotification(
    endpoint: string,
    title: string,
    body: string
  ): Promise<boolean> {
    try {
      console.log(`[PUSH DEMO] Simulating notification to: ${endpoint.slice(0, 50)}...`);
      console.log(`[PUSH DEMO] Title: ${title}`);
      console.log(`[PUSH DEMO] Body: ${body}`);
      
      // In a real implementation, this would use the web-push library:
      // await webpush.sendNotification(subscription, payload, options);
      
      return true;
    } catch (error) {
      console.error('[PUSH DEMO] Simulation failed:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
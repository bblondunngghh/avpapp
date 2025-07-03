// Continuous Notification System for Help Requests
import { notificationSoundService } from './notification-sound';

interface ContinuousNotification {
  requestId: string;
  startTime: number;
  intervalId: NodeJS.Timeout;
  title: string;
  message: string;
  isOwnRequest: boolean; // Track if this device sent the request
}

class ContinuousNotificationService {
  private activeNotifications = new Map<string, ContinuousNotification>();
  private readonly NOTIFICATION_INTERVAL = 30000; // 30 seconds
  private readonly MAX_DURATION = 180000; // 3 minutes

  constructor() {
    // Listen for help response events to stop notifications
    this.setupHelpResponseListener();
  }

  private setupHelpResponseListener() {
    // Check for help responses every 10 seconds to stop continuous notifications
    setInterval(async () => {
      if (this.activeNotifications.size > 0) {
        await this.checkForHelpResponses();
      }
    }, 10000);
  }

  private async checkForHelpResponses() {
    try {
      const response = await fetch('/api/help-responses/recent');
      const helpResponses = await response.json();

      // Check if any active notifications have received responses
      this.activeNotifications.forEach((notification, requestId) => {
        const hasResponse = helpResponses.some((resp: any) => 
          resp.helpRequestId === requestId && resp.status === 'dispatched'
        );

        if (hasResponse) {
          console.log(`[CONTINUOUS] Valet dispatched for request ${requestId} - stopping notifications`);
          this.stopContinuousNotification(requestId);
        }
      });
    } catch (error) {
      console.warn('[CONTINUOUS] Failed to check help responses:', error);
    }
  }

  public startContinuousNotification(requestId: string, title: string, message: string, isOwnRequest: boolean = false) {
    // Stop any existing notification for this request
    this.stopContinuousNotification(requestId);

    console.log(`[CONTINUOUS] Starting 3-minute notification cycle for request ${requestId}${isOwnRequest ? ' (own request - no sounds)' : ''}`);

    const intervalId = setInterval(async () => {
      if (!isOwnRequest) {
        await this.sendUrgentNotification(title, message);
      }
    }, this.NOTIFICATION_INTERVAL);

    // Store the notification details
    const notification: ContinuousNotification = {
      requestId,
      startTime: Date.now(),
      intervalId,
      title,
      message,
      isOwnRequest
    };

    this.activeNotifications.set(requestId, notification);

    // Send first immediate notification only if not own request
    if (!isOwnRequest) {
      this.sendUrgentNotification(title, message);
    }

    // Auto-stop after 3 minutes
    setTimeout(() => {
      this.stopContinuousNotification(requestId);
    }, this.MAX_DURATION);
  }

  public stopContinuousNotification(requestId: string) {
    const notification = this.activeNotifications.get(requestId);
    if (notification) {
      clearInterval(notification.intervalId);
      this.activeNotifications.delete(requestId);
      console.log(`[CONTINUOUS] Stopped notification cycle for request ${requestId}`);
    }
  }

  public stopAllContinuousNotifications() {
    this.activeNotifications.forEach((notification, requestId) => {
      clearInterval(notification.intervalId);
    });
    this.activeNotifications.clear();
    console.log('[CONTINUOUS] Stopped all notification cycles');
  }

  private async sendUrgentNotification(title: string, message: string) {
    try {
      // Play MAXIMUM VOLUME urgent sound - force override any volume parameter
      await notificationSoundService.playLoudNotificationSound(1.0, 2000);

      // Show browser notification if permissions granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/icon-192x192.png',
          requireInteraction: true,
          silent: false // Ensure not silent
        });

        // Auto-close after 15 seconds to allow full alarm sequence
        setTimeout(() => notification.close(), 15000);
      }

      console.log(`[CONTINUOUS] MAXIMUM VOLUME urgent notification sent: ${title}`);
    } catch (error) {
      console.warn('[CONTINUOUS] Failed to send urgent notification:', error);
    }
  }

  public getActiveNotifications(): string[] {
    return Array.from(this.activeNotifications.keys());
  }

  public isNotificationActive(requestId: string): boolean {
    return this.activeNotifications.has(requestId);
  }
}

export const continuousNotificationService = new ContinuousNotificationService();
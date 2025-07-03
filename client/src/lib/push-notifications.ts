// Web Push Notifications Service
export class PushNotificationService {
  // Demo VAPID public key - in production, this should be generated properly
  private vapidPublicKey = 'BMELZJJCzJwjSJhpzPqNKWE_6-FqbQgKqRGFOPwQckhLnf0nHj5-BTSA-RLKb4VFNYoMKRheFYxg3yp8tPcb1iI';

  public async isSupported(): Promise<boolean> {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  public async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  public async subscribe(): Promise<PushSubscription | null> {
    if (!await this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission denied for notifications');
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey),
    });

    return subscription;
  }

  public async unsubscribe(): Promise<boolean> {
    if (!await this.isSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return false;
    }

    return await subscription.unsubscribe();
  }

  public async getSubscription(): Promise<PushSubscription | null> {
    if (!await this.isSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return null;
    }

    return await registration.pushManager.getSubscription();
  }

  public async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  }

  public async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push-subscription', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification (fallback)
  public showLocalNotification(title: string, message: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        requireInteraction: true,
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();
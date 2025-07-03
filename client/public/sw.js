// Service Worker for Push Notifications - Version 1.1.0
const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE = `access-valet-static-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  console.log('Service Worker installed - Version 1.1.0');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Cache opened');
      return cache.addAll([
        '/',
        '/help-request',
        '/manifest.json'
      ]);
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated - Version 1.1.0');
  
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      clients.claim()
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'New help request notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: data.image,
    vibrate: [300, 100, 300, 100, 300, 100, 300], // Longer vibration pattern
    requireInteraction: true,
    silent: false, // Ensure sound plays
    actions: [
      {
        action: 'view',
        title: 'View Request',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icon-192x192.png'
      }
    ],
    data: {
      url: data.url || '/help-request',
      requestId: data.requestId
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Access Valet Parking', options),
      playLoudNotificationSound()
    ])
  );
});

// Function to play urgent notification sound at maximum volume
async function playLoudNotificationSound() {
  try {
    // Send message to all clients to play urgent sound
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    
    clients.forEach(client => {
      client.postMessage({
        type: 'PLAY_NOTIFICATION_SOUND',
        volume: 1.0, // Maximum volume
        duration: 1500
      });
    });
    
    console.log('[SW] URGENT notification sound command sent to clients at max volume');
  } catch (error) {
    console.warn('[SW] Could not send sound command:', error);
  }
}

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/help-request';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'help-request-sync') {
    event.waitUntil(syncHelpRequests());
  }
});

async function syncHelpRequests() {
  try {
    // Sync any pending help requests when back online
    const response = await fetch('/api/help-requests/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('Help requests synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync help requests:', error);
  }
}
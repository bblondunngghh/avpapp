// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
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
    vibrate: [200, 100, 200],
    requireInteraction: true,
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
    self.registration.showNotification(data.title || 'Access Valet Parking', options)
  );
});

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
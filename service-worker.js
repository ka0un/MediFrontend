// Service Worker for Offline Access (UC-04 A4)
// This service worker caches medical records for offline access

const CACHE_NAME = 'medi-offline-v2';
const MEDICAL_RECORDS_CACHE = 'medical-records-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle medical records API requests
  if (url.pathname.includes('/api/medical-records')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          
          // Store in IndexedDB for offline access
          if (response.status === 200) {
            caches.open(MEDICAL_RECORDS_CACHE)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('Serving from cache (offline mode):', event.request.url);
                return cachedResponse;
              }
              
              // Return offline response
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: 'You are offline. Showing cached data.',
                  timestamp: new Date().toISOString()
                }),
                {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
  } else {
    // For other requests, use cache first strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== MEDICAL_RECORDS_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Background sync for queued operations when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-medical-records') {
    event.waitUntil(syncMedicalRecords());
  }
});

async function syncMedicalRecords() {
  // Get queued operations from IndexedDB
  const db = await openDatabase();
  const tx = db.transaction(['sync-queue'], 'readonly');
  const store = tx.objectStore('sync-queue');
  const queuedOperations = await store.getAll();
  
  // Process each queued operation
  for (const operation of queuedOperations) {
    try {
      await fetch(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: operation.body
      });
      
      // Remove from queue after successful sync
      const deleteTx = db.transaction(['sync-queue'], 'readwrite');
      await deleteTx.objectStore('sync-queue').delete(operation.id);
    } catch (error) {
      console.error('Failed to sync operation:', error);
    }
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MediOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('medical-records')) {
        db.createObjectStore('medical-records', { keyPath: 'patientId' });
      }
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

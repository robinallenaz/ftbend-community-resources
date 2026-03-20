const CACHE_NAME = 'ftbend-community-v1';
const STATIC_CACHE = 'ftbend-static-v1';
const IMAGE_CACHE = 'ftbend-images-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/blog',
  '/resources',
  '/events',
  '/about',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Cache management configuration
const CACHE_CONFIG = {
  MAX_IMAGE_CACHE_SIZE: 50,
  MAX_STATIC_CACHE_SIZE: 100,
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  LRU_CACHE_SIZE: 30 // Keep track of recently used items
};

// Cache timestamp storage
const cacheTimestamps = new Map();

// Helper function to check if cache entry is expired
function isCacheExpired(timestamp, ttl = CACHE_CONFIG.CACHE_TTL) {
  return Date.now() - timestamp > ttl;
}

// Helper function to update cache timestamp
function updateCacheTimestamp(key) {
  cacheTimestamps.set(key, Date.now());
}

// Helper function to clean expired entries
async function cleanExpiredEntries(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const now = Date.now();
    
    const expiredRequests = requests.filter(request => {
      const timestamp = cacheTimestamps.get(request.url);
      return timestamp && isCacheExpired(timestamp);
    });
    
    await Promise.all(expiredRequests.map(request => {
      cacheTimestamps.delete(request.url);
      return cache.delete(request);
    }));
    
    if (expiredRequests.length > 0) {
      console.log(`Cleaned ${expiredRequests.length} expired entries from ${cacheName}`);
    }
  } catch (error) {
    console.error('Error cleaning expired entries:', error);
  }
}

// LRU Cache for tracking recently used items
class LRUCache {
  constructor(maxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  entries() {
    return Array.from(this.cache.entries());
  }
}

// LRU cache for tracking image access times
const imageAccessCache = new LRUCache(CACHE_CONFIG.LRU_CACHE_SIZE);

// Add cache size management with improved atomic locking mechanism
let cacheManagementMutex = false;

async function manageImageCache() {
  // Simple mutex approach to prevent deadlock
  if (cacheManagementMutex) {
    console.log('Cache management already in progress, skipping');
    return;
  }

  cacheManagementMutex = true;
  const startTime = Date.now();
  const operationId = `cache-op-${startTime}`;
  
  try {
    console.log(`[${operationId}] Starting cache management`);
    
    // First clean expired entries
    await cleanExpiredEntries(IMAGE_CACHE);
    
    const cache = await caches.open(IMAGE_CACHE);
    const requests = await cache.keys();
    
    if (requests.length > CACHE_CONFIG.MAX_IMAGE_CACHE_SIZE) {
      // Get access times from LRU cache and filter out expired entries
      const validRequests = requests.filter(request => {
        const timestamp = cacheTimestamps.get(request.url);
        return !timestamp || !isCacheExpired(timestamp);
      });
      
      if (validRequests.length > CACHE_CONFIG.MAX_IMAGE_CACHE_SIZE) {
        // Get access times from LRU cache
        const requestsWithAccessTime = await Promise.all(
          validRequests.map(async (request) => {
            const url = request.url;
            const accessTime = imageAccessCache.get(url) || 0;
            
            // Try to get actual timestamp from response headers
            try {
              const response = await cache.match(request);
              const dateHeader = response?.headers.get('date');
              const lastModified = response?.headers.get('last-modified');
              const headerTime = dateHeader || lastModified;
              
              if (headerTime) {
                const headerTimestamp = new Date(headerTime).getTime();
                // Use the most recent of access time or header time
                return {
                  request,
                  timestamp: Math.max(accessTime, headerTimestamp)
                };
              }
            } catch (error) {
              console.warn(`[${operationId}] Error getting headers for ${url}:`, error);
            }
            
            return { request, timestamp: accessTime };
          })
        );
        
        // Sort by timestamp (oldest first) - LRU approach
        requestsWithAccessTime.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest entries
        const oldestRequests = requestsWithAccessTime.slice(0, validRequests.length - CACHE_CONFIG.MAX_IMAGE_CACHE_SIZE);
        
        // Update LRU cache and delete old entries
        await Promise.all(oldestRequests.map(async ({ request }) => {
          try {
            imageAccessCache.delete(request.url);
            cacheTimestamps.delete(request.url);
            await cache.delete(request);
          } catch (error) {
            console.error(`[${operationId}] Failed to delete cache entry:`, error);
          }
        }));
        
        console.log(`[${operationId}] Cleaned up ${oldestRequests.length} old images from cache using LRU strategy`);
      }
    }
    
    console.log(`[${operationId}] Cache management completed successfully`);
  } catch (error) {
    console.error(`[${operationId}] Failed to manage image cache:`, error);
    throw error;
  } finally {
    // Always release the mutex
    cacheManagementMutex = false;
    console.log(`[${operationId}] Cache management mutex released`);
  }
}

// Activate event - clean up old caches with safer logic
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Define valid cache names explicitly to prevent accidental deletion
      const validCacheNames = new Set([STATIC_CACHE, IMAGE_CACHE, CACHE_NAME]);
      
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Only delete caches that are not in our valid set
          if (!validCacheNames.has(cacheName)) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for 5 minutes
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              updateCacheTimestamp(request.url);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          // Check if cached response is still valid
          if (cachedResponse) {
            const timestamp = cacheTimestamps.get(request.url);
            if (!timestamp || !isCacheExpired(timestamp, 5 * 60 * 1000)) { // 5 minutes for API
              return cachedResponse;
            }
          }
          return new Response('Service unavailable', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        })
    );
  } else if (url.hostname.includes('cloudinary.com') || 
             url.pathname.includes('/uploads/')) {
    // Image requests - cache first, network fallback
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            // Check if cached response is still valid
            const timestamp = cacheTimestamps.get(request.url);
            if (!timestamp || !isCacheExpired(timestamp)) {
              // Update access time for LRU
              imageAccessCache.get(request.url);
              return response;
            }
          }
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseToCache = response.clone();
                caches.open(IMAGE_CACHE).then((cache) => {
                  cache.put(request, responseToCache);
                  updateCacheTimestamp(request.url);
                });
              }
              return response;
            });
        })
    );
  } else {
    // Static assets and other requests - network first, cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
              updateCacheTimestamp(request.url);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any pending actions when back online
      console.log('Background sync triggered')
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Fort Bend Community', options)
    );
  }
});

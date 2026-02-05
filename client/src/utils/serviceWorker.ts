// Store interval ID for cleanup
let updateInterval: NodeJS.Timeout | null = null;
let isRegistered = false;
let currentRegistration: ServiceWorkerRegistration | null = null;
let activationCheckTimeout: NodeJS.Timeout | null = null;

// Mutex for preventing race conditions with timeout and cleanup
let registrationMutex: { 
  locked: boolean; 
  waiters: Map<string, (value: boolean) => void>;
  waiterCounter: number;
} = {
  locked: false,
  waiters: new Map(),
  waiterCounter: 0
};
let operationId = 0;

// Generate unique operation ID for tracking
function getOperationId(): string {
  return `sw-op-${++operationId}-${Date.now()}`;
}

// Acquire mutex with proper timeout and cleanup
async function acquireMutex(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    if (!registrationMutex.locked) {
      registrationMutex.locked = true;
      resolve(true);
      return;
    }

    // Add to waiters queue with timeout cleanup
    const waiterId = `waiter-${++registrationMutex.waiterCounter}-${Date.now()}`;
    const waiter = (result: boolean) => {
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      if (registrationMutex.waiters.has(waiterId)) {
        registrationMutex.waiters.delete(waiterId);
      }
      resolve(false); // Timeout
    }, timeout);

    registrationMutex.waiters.set(waiterId, waiter);
  });
}

// Release mutex and notify next waiter with error handling
function releaseMutex(): void {
  try {
    if (registrationMutex.waiters.size > 0) {
      // Get the first waiter (FIFO)
      const firstKey = registrationMutex.waiters.keys().next().value;
      if (firstKey) {
        const next = registrationMutex.waiters.get(firstKey);
        registrationMutex.waiters.delete(firstKey);
        if (next) {
          // Pass the lock to the next waiter
          next(true);
        } else {
          // No waiter found, unlock
          registrationMutex.locked = false;
        }
      } else {
        registrationMutex.locked = false;
      }
    } else {
      registrationMutex.locked = false;
    }
  } catch (error) {
    console.error('Error releasing mutex:', error);
    // Force unlock on error to prevent deadlock
    registrationMutex.locked = false;
    registrationMutex.waiters.clear();
  }
}

// Store event handlers for cleanup
let networkStatusHandler: (() => void) | null = null;

export function cleanupServiceWorker() {
  try {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    if (activationCheckTimeout) {
      clearTimeout(activationCheckTimeout);
      activationCheckTimeout = null;
    }
    
    // Clean up network status listeners
    if (networkStatusHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', networkStatusHandler);
      window.removeEventListener('offline', networkStatusHandler);
      networkStatusHandler = null;
    }
    
    // Reset mutex state completely with error handling
    try {
      registrationMutex.waiters.forEach(waiter => {
        try {
          waiter(false); // Notify all waiters of cancellation
        } catch (error) {
          console.error('Error notifying waiter during cleanup:', error);
        }
      });
    } catch (error) {
      console.error('Error during mutex cleanup:', error);
    } finally {
      registrationMutex.locked = false;
      registrationMutex.waiters.clear();
    }
    
    isRegistered = false;
    currentRegistration = null;
  } catch (error) {
    console.error('Error during service worker cleanup:', error);
    // Force reset all state to prevent hanging
    updateInterval = null;
    activationCheckTimeout = null;
    networkStatusHandler = null;
    registrationMutex.locked = false;
    registrationMutex.waiters.clear();
    isRegistered = false;
    currentRegistration = null;
  }
}

// Consolidated interval setup function with proper synchronization
async function setupUpdateInterval(registration: ServiceWorkerRegistration): Promise<void> {
  const opId = getOperationId();
  console.log(`[${opId}] Setting up update interval`);
  
  // Clear any existing intervals first
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }

  // Acquire mutex to prevent race conditions
  if (!await acquireMutex()) {
    console.log(`[${opId}] Could not acquire mutex, skipping interval setup`);
    return;
  }

  try {
    // Double-check registration state with mutex protection
    const currentReg = currentRegistration;
    const isActive = isRegistered;
    
    if (!registration.active || !isActive || currentReg !== registration) {
      console.log(`[${opId}] Registration no longer valid, skipping interval setup`);
      return;
    }

    // Verify registration is still active by checking its state
    if (registration.active.state !== 'activated' && registration.active.state !== 'activating') {
      console.log(`[${opId}] Service worker not in proper state: ${registration.active.state}`);
      return;
    }

    updateInterval = setInterval(() => {
      // Capture current state at the beginning of the operation
      const currentReg = currentRegistration;
      const isActive = isRegistered;
      const intervalId = updateInterval;
      
      // Verify all conditions are still met
      if (!currentReg || !registration.active || !isActive || currentReg !== registration || !intervalId) {
        console.log(`[${opId}] ServiceWorker registration no longer valid during interval, cleaning up`);
        cleanupServiceWorker();
        return;
      }
      
      // Additional safety check - verify service worker state
      if (registration.active.state !== 'activated') {
        console.log(`[${opId}] Service worker deactivated during interval, cleaning up`);
        cleanupServiceWorker();
        return;
      }
      
      try {
        registration.update();
      } catch (error) {
        console.error(`[${opId}] Error during service worker update:`, error);
        cleanupServiceWorker();
      }
    }, 60 * 60 * 1000); // Check every hour
    
    console.log(`[${opId}] ServiceWorker update interval established successfully`);
  } finally {
    releaseMutex();
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !isRegistered) {
    // Acquire mutex to prevent concurrent registrations
    if (!await acquireMutex()) {
      console.log('Could not acquire registration mutex, skipping');
      return;
    }

    try {
      // Double-check registration status after acquiring mutex
      if (isRegistered) {
        console.log('ServiceWorker registration already in progress or completed');
        return;
      }

      await new Promise<void>((resolve, reject) => {
        window.addEventListener('load', async () => {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const opId = getOperationId();
            console.log(`[${opId}] SW registered: `, registration);
            
            // Final atomic check to prevent multiple registrations
            if (isRegistered) {
              console.log(`[${opId}] ServiceWorker already registered by another call, skipping`);
              resolve();
              return;
            }
            
            // Set registration flag atomically
            isRegistered = true;
            currentRegistration = registration;
            
            // Set up update interval based on service worker state
            if (registration.active) {
              if (registration.active.state === 'activated') {
                await setupUpdateInterval(registration);
              } else {
                console.log(`[${opId}] ServiceWorker not activated yet (state: ${registration.active.state}), will check for activation`);
                // Set up a one-time check for activation with proper cleanup
                const registrationRef = registration;
                const handleActivation = async () => {
                  const checkOpId = getOperationId();
                  const currentReg = currentRegistration;
                  const isActive = isRegistered;
                  
                  if (registrationRef.active && 
                      currentReg === registrationRef && 
                      isActive &&
                      registrationRef.active.state === 'activated') {
                    console.log(`[${checkOpId}] ServiceWorker activated, setting up update interval`);
                    await setupUpdateInterval(registrationRef);
                    // Clean up event listener and timeout
                    navigator.serviceWorker.removeEventListener('controllerchange', handleActivation);
                    if (activationCheckTimeout) {
                      clearTimeout(activationCheckTimeout);
                      activationCheckTimeout = null;
                    }
                  } else {
                    console.log(`[${checkOpId}] ServiceWorker activation check failed or registration changed (state: ${registrationRef.active?.state})`);
                  }
                };
                
                activationCheckTimeout = setTimeout(async () => {
                  const checkOpId = getOperationId();
                  const currentReg = currentRegistration;
                  const isActive = isRegistered;
                  
                  if (registrationRef.active && 
                      currentReg === registrationRef && 
                      isActive &&
                      registrationRef.active.state === 'activated') {
                    console.log(`[${checkOpId}] ServiceWorker activated via timeout, setting up update interval`);
                    await setupUpdateInterval(registrationRef);
                  } else {
                    console.log(`[${checkOpId}] ServiceWorker activation timeout, will try controllerchange event`);
                    // Fall back to controllerchange event
                    navigator.serviceWorker.addEventListener('controllerchange', handleActivation);
                  }
                  activationCheckTimeout = null;
                }, 5000); // Check again in 5 seconds
              }
            } else {
              console.log(`[${opId}] ServiceWorker not active yet, waiting for activation event`);
              // Listen for activation event with proper cleanup
              const handleActivation = async () => {
                const checkOpId = getOperationId();
                console.log(`[${checkOpId}] ServiceWorker activation event received`);
                const currentReg = currentRegistration;
                const isActive = isRegistered;
                
                if (registration.active && 
                    registration.active.state === 'activated' &&
                    currentReg === registration && 
                    isActive) {
                  await setupUpdateInterval(registration);
                  // Clean up event listener
                  navigator.serviceWorker.removeEventListener('controllerchange', handleActivation);
                }
              };
              navigator.serviceWorker.addEventListener('controllerchange', handleActivation);
            }
            
            resolve();
          } catch (registrationError) {
            console.error('SW registration failed: ', registrationError);
            cleanupServiceWorker();
            reject(registrationError);
          }
        });
      });
    } finally {
      releaseMutex();
    }
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Acquire mutex to prevent race conditions
    if (!await acquireMutex()) {
      console.log('Could not acquire unregistration mutex, skipping');
      return;
    }

    try {
      // Clear the update interval before unregistering
      cleanupServiceWorker();
      
      const registration = await navigator.serviceWorker.ready;
      const success = await registration.unregister();
      
      if (success) {
        isRegistered = false;
        currentRegistration = null;
        console.log('SW unregistered successfully');
      } else {
        console.log('SW unregistration failed');
      }
    } catch (error) {
      console.error('SW unregistration failed:', error);
    } finally {
      releaseMutex();
    }
  }
}

// Cache management utilities
export async function clearImageCache() {
  if ('caches' in window) {
    try {
      await caches.delete('ftbend-images-v1');
      console.log('Image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }
}

// Add cache size management with proper synchronization
let cacheManagementMutex = false;

async function manageImageCache(): Promise<void> {
  // Prevent concurrent cache management operations
  if (cacheManagementMutex) {
    console.log('Cache management already in progress, skipping');
    return;
  }

  cacheManagementMutex = true;
  const opId = getOperationId();
  
  try {
    console.log(`[${opId}] Starting cache management`);
    
    if (!('caches' in window)) {
      console.log(`[${opId}] Cache API not available`);
      return;
    }

    const cache = await caches.open('ftbend-images-v1');
    const requests = await cache.keys();
    const MAX_CACHE_SIZE = 50; // Limit to 50 images
    
    if (requests.length > MAX_CACHE_SIZE) {
      // Use LRU approach - sort by last accessed time if available, otherwise FIFO
      const requestsWithMetadata = await Promise.all(
        requests.map(async (request) => {
          try {
            const response = await cache.match(request);
            const date = response?.headers.get('date') || response?.headers.get('last-modified');
            return {
              request,
              timestamp: date ? new Date(date).getTime() : 0
            };
          } catch {
            return { request, timestamp: 0 };
          }
        })
      );
      
      // Sort by timestamp (oldest first) and remove oldest entries
      requestsWithMetadata.sort((a, b) => a.timestamp - b.timestamp);
      const oldestRequests = requestsWithMetadata.slice(0, requests.length - MAX_CACHE_SIZE);
      
      await Promise.all(oldestRequests.map(({ request }) => cache.delete(request)));
      console.log(`[${opId}] Cleaned up ${oldestRequests.length} old images from cache`);
    }
    
    console.log(`[${opId}] Cache management completed successfully`);
  } catch (error) {
    console.error(`[${opId}] Failed to manage image cache:`, error);
  } finally {
    cacheManagementMutex = false;
  }
}

export async function clearAllCaches() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
}

// Network status monitoring
export function setupNetworkStatusMonitoring() {
  if (typeof window !== 'undefined') {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      document.body.classList.toggle('offline', !isOnline);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('network-status-changed', {
        detail: { isOnline }
      }));
    };

    // Store handler for cleanup
    networkStatusHandler = updateOnlineStatus;
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
  }
}

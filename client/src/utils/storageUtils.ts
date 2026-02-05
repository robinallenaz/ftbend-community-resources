/**
 * Safe localStorage operations with consistent error handling
 */

export class StorageError extends Error {
  name = 'StorageError';
  code?: 'QUOTA_EXCEEDED' | 'STORAGE_DISABLED' | 'SERIALIZATION_ERROR' | 'UNKNOWN';

  constructor(message: string, code?: StorageError['code']) {
    super(message);
    this.code = code;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError);
    }
  }
}

/**
 * Safely set an item in localStorage with error handling
 * @param key - The storage key
 * @param value - The value to store (will be JSON stringified)
 * @returns Promise that resolves to true if successful
 * @throws StorageError if operation fails
 */
export async function safeSetItem(key: string, value: any): Promise<boolean> {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      throw new StorageError('localStorage is not available', 'STORAGE_DISABLED');
    }

    // Serialize the value
    let serializedValue: string;
    try {
      serializedValue = JSON.stringify(value);
    } catch (serializeError) {
      throw new StorageError('Failed to serialize value', 'SERIALIZATION_ERROR');
    }

    // Try to set the item
    try {
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error: any) {
      // Handle quota exceeded error with retry logic
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('Storage quota exceeded, attempting to free space...');
        
        // Retry with exponential backoff and maximum attempts
        for (let attempt = 1; attempt <= STORAGE_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
          const spaceFreed = await tryToFreeStorageSpace({
            maxItems: Math.min(STORAGE_CONFIG.MAX_CLEANUP_ITEMS * attempt, 20), // Increase items with each attempt
            batchSize: STORAGE_CONFIG.CLEANUP_BATCH_SIZE,
            timeout: STORAGE_CONFIG.PROCESSING_TIMEOUT
          });
          
          if (spaceFreed) {
            try {
              localStorage.setItem(key, serializedValue);
              console.log(`Successfully stored after freeing space (attempt ${attempt})`);
              return true;
            } catch (retryError) {
              if (attempt === STORAGE_CONFIG.MAX_RETRY_ATTEMPTS) {
                // Last attempt failed
                throw new StorageError(
                  'Storage quota exceeded after all cleanup attempts', 
                  'QUOTA_EXCEEDED'
                );
              }
              
              // Wait before next retry with exponential backoff
              const delay = getRetryDelay(attempt);
              console.warn(`Retry ${attempt} failed, waiting ${delay}ms before next attempt`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            if (attempt === STORAGE_CONFIG.MAX_RETRY_ATTEMPTS) {
              throw new StorageError(
                'Storage quota exceeded and unable to free additional space', 
                'QUOTA_EXCEEDED'
              );
            }
            
            // Wait before next retry
            const delay = getRetryDelay(attempt);
            console.warn(`Cleanup attempt ${attempt} failed, waiting ${delay}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } else {
        // Other types of errors
        throw new StorageError(
          error.message || 'Unknown localStorage error', 
          'UNKNOWN'
        );
      }
      
      // This should never be reached due to throws above
      return false;
    }
  } catch (error) {
    // Log and re-throw StorageError
    if (error instanceof StorageError) {
      console.error('localStorage error:', error);
      throw error;
    }
    
    // Wrap unexpected errors
    const storageError = new StorageError(
      error instanceof Error ? error.message : 'Unknown error', 
      'UNKNOWN'
    );
    console.error('Unexpected localStorage error:', error);
    throw storageError;
  }
}

/**
 * Safely get an item from localStorage with error handling
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist or error occurs
 * @returns Promise that resolves to the parsed value or default
 */
export function safeGetItem<T>(key: string, defaultValue: T): Promise<T> {
  return new Promise((resolve) => {
    try {
      if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available');
        resolve(defaultValue);
        return;
      }

      const item = localStorage.getItem(key);
      if (item === null) {
        resolve(defaultValue);
        return;
      }

      try {
        const parsed = JSON.parse(item);
        resolve(parsed);
      } catch (parseError) {
        console.error('Failed to parse localStorage item:', parseError);
        resolve(defaultValue);
      }
    } catch (error) {
      console.error('localStorage getItem error:', error);
      resolve(defaultValue);
    }
  });
}

/**
 * Safely remove an item from localStorage
 * @param key - The storage key
 * @returns Promise that resolves to true if successful
 * @throws StorageError if operation fails
 */
export function safeRemoveItem(key: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof localStorage === 'undefined') {
        const error = new StorageError('localStorage is not available', 'STORAGE_DISABLED');
        console.error('localStorage error:', error);
        reject(error);
        return;
      }

      localStorage.removeItem(key);
      resolve(true);
    } catch (error) {
      const storageError = new StorageError(
        error instanceof Error ? error.message : 'Unknown localStorage error', 
        'UNKNOWN'
      );
      console.error('localStorage removeItem error:', error);
      reject(storageError);
    }
  });
}

/**
 * Configuration for storage management
 */
const STORAGE_CONFIG = {
  MAX_CACHE_SIZE: 50,
  MAX_CLEANUP_ITEMS: 5,
  MAX_PROCESSING_LIMIT: 100,
  CLEANUP_BATCH_SIZE: 10,
  PROCESSING_TIMEOUT: 5000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000 // Base delay in milliseconds for exponential backoff
} as const;

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  return STORAGE_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
}

/**
 * Try to free up storage space by clearing old/expired data with configurable limits
 * @returns Promise that resolves to true if space was freed, false otherwise
 */
export async function tryToFreeStorageSpace(options: {
  maxItems?: number;
  batchSize?: number;
  timeout?: number;
} = {}): Promise<boolean> {
  const {
    maxItems = STORAGE_CONFIG.MAX_CLEANUP_ITEMS,
    batchSize = STORAGE_CONFIG.CLEANUP_BATCH_SIZE,
    timeout = STORAGE_CONFIG.PROCESSING_TIMEOUT
  } = options;

  const startTime = Date.now();
  
  try {
    // List of keys that can be safely cleared (old drafts, cache, etc.)
    const clearableKeys: (string | RegExp)[] = [
      'blogPostDraft',
      /^adminBlogPostDraft_\d{13}$/, // More specific timestamp pattern with proper anchoring
    ];

    let spaceFreed = false;
    const keysWithTimestamps: Array<{key: string, timestamp: number}> = [];

    // First pass: collect all keys with their timestamps
    for (const pattern of clearableKeys) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.warn('Storage cleanup timeout reached');
        break;
      }
      
      if (typeof pattern === 'string') {
        try {
          const value = localStorage.getItem(pattern);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              // Verify it's actually a draft with expected structure
              if (parsed.savedAt && parsed.content !== undefined) {
                const timestamp = new Date(parsed.savedAt).getTime();
                keysWithTimestamps.push({ key: pattern, timestamp });
              }
            } catch {
              // If we can't parse, treat it as very old (0 timestamp)
              keysWithTimestamps.push({ key: pattern, timestamp: 0 });
            }
          }
        } catch (error) {
          console.error(`Failed to access key ${pattern}:`, error);
        }
      } else if (pattern instanceof RegExp) {
        // Collect all keys matching the regex with optimized bounds checking
        const storageLength = localStorage.length;
        const processingLimit = Math.min(storageLength, STORAGE_CONFIG.MAX_PROCESSING_LIMIT);
        const processedKeys = new Set<string>(); // Avoid duplicate processing
        let processedCount = 0;
        
        // Use Object.keys approach for better performance when available
        let keys: string[] = [];
        try {
          // Try to get all keys at once (more efficient)
          keys = Object.keys(localStorage);
        } catch {
          // Fallback to manual iteration
          for (let i = 0; i < storageLength; i++) {
            const key = localStorage.key(i);
            if (key) keys.push(key);
          }
        }
        
        // Process keys in batches to avoid blocking
        for (let i = 0; i < keys.length && processedCount < processingLimit; i++) {
          // Check timeout
          if (Date.now() - startTime > timeout) {
            console.warn('Storage cleanup timeout reached during regex processing');
            break;
          }
          
          const key = keys[i];
          if (key && pattern.test(key) && !processedKeys.has(key)) {
            processedKeys.add(key);
            processedCount++;
            
            try {
              const value = localStorage.getItem(key);
              if (value) {
                try {
                  const parsed = JSON.parse(value);
                  // Verify it's actually a draft with expected structure
                  if (parsed.savedAt && parsed.content !== undefined) {
                    const timestamp = new Date(parsed.savedAt).getTime();
                    keysWithTimestamps.push({ key, timestamp });
                  }
                } catch {
                  // If we can't parse, treat it as very old (0 timestamp)
                  keysWithTimestamps.push({ key, timestamp: 0 });
                }
              }
            } catch (error) {
              console.error(`Failed to access key ${key}:`, error);
            }
          }
        }
        
        if (processedCount >= processingLimit) {
          console.warn(`Reached processing limit of ${processingLimit} for storage cleanup to prevent performance issues`);
        }
      }
    }

    // Sort by timestamp (oldest first) and remove oldest entries
    keysWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove up to maxItems oldest entries in batches with early termination
    const entriesToRemove = Math.min(maxItems, keysWithTimestamps.length);
    const batches = Math.ceil(entriesToRemove / batchSize);
    let totalBytesFreed = 0;
    const MIN_SPACE_TO_FREE = 1024 * 1024; // 1MB minimum target
    
    for (let batch = 0; batch < batches; batch++) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.warn('Storage cleanup timeout reached during deletion');
        break;
      }
      
      // Early termination if we've freed sufficient space
      if (totalBytesFreed >= MIN_SPACE_TO_FREE && spaceFreed) {
        console.log(`Early termination: freed ${totalBytesFreed} bytes, sufficient space cleared`);
        break;
      }
      
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, entriesToRemove);
      let batchBytesFreed = 0;
      
      for (let i = startIdx; i < endIdx; i++) {
        try {
          // Calculate size before removal to track actual space freed
          const key = keysWithTimestamps[i].key;
          const value = localStorage.getItem(key);
          const itemSize = value ? new Blob([value]).size : 0;
          
          localStorage.removeItem(key);
          spaceFreed = true;
          batchBytesFreed += itemSize;
        } catch (error) {
          console.error(`Failed to remove key ${keysWithTimestamps[i].key}:`, error);
        }
      }
      
      totalBytesFreed += batchBytesFreed;
      console.log(`Batch ${batch + 1}: freed ${batchBytesFreed} bytes, total: ${totalBytesFreed} bytes`);
      
      // Small delay between batches to prevent blocking
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return spaceFreed;
  } catch (error) {
    console.error('Error trying to free storage space:', error);
    return false;
  }
}

/**
 * Check if localStorage is available and has quota
 * @returns Promise that resolves to storage info
 */
export function checkStorageAvailability(): Promise<{
  available: boolean;
  remainingSpace?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      if (typeof localStorage === 'undefined') {
        resolve({ available: false, error: 'localStorage is not available' });
        return;
      }

      // Try to store a test value
      const testKey = '__storage_test__';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        resolve({ available: true });
      } else {
        resolve({ available: false, error: 'localStorage test failed' });
      }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        resolve({ available: false, error: 'Storage quota exceeded' });
      } else {
        resolve({ available: false, error: error.message });
      }
    }
  });
}

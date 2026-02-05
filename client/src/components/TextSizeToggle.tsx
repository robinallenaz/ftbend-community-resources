import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { safeSetItem, safeGetItem } from '../utils/storageUtils';

const KEY = 'ftbend_text_scale';

// Custom event for text scale changes
const TEXT_SCALE_EVENT = 'textScaleChange';

// Improved debounce utility function with proper cleanup
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): {
  debounced: T;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  }) as T;
  
  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return { debounced, cancel };
}

export default function TextSizeToggle() {
  const [scale, setScale] = useState<number>(1); // Default value
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastAnnouncedScale, setLastAnnouncedScale] = useState<number>();

  const options = useMemo(() => [0.95, 1, 1.15, 1.25], []);
  const liveRegionRef = useRef<HTMLElement | null>(null);
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);
  const eventListenerRef = useRef<EventListener | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Debounced save function with proper cleanup
  const debouncedSaveScale = useCallback((newScale: number) => {
    // Cancel previous debounce if exists
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
    }
    
    // Create new debounce function
    debouncedSaveRef.current = debounce(async (scale: number) => {
      try {
        await safeSetItem(KEY, scale);
      } catch (error) {
        console.error('Failed to save text scale:', error);
      }
    }, 300);
    
    // Call the debounced function
    debouncedSaveRef.current.debounced(newScale);
  }, []);

  // Cleanup function for proper resource management
  const cleanup = useCallback(() => {
    // Cancel debounce
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
      debouncedSaveRef.current = null;
    }
    
    // Remove event listener
    if (eventListenerRef.current) {
      window.removeEventListener(TEXT_SCALE_EVENT, eventListenerRef.current);
      eventListenerRef.current = null;
    }
    
    // Remove live region
    if (liveRegionRef.current && liveRegionRef.current.parentNode) {
      liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
      liveRegionRef.current = null;
    }
    
    // Clear cleanup ref
    if (cleanupRef.current) {
      cleanupRef.current = null;
    }
  }, []);

  // Handle text scale change events
  const handleTextScaleChange = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ scale: number }>;
    if (customEvent.detail?.scale && typeof customEvent.detail.scale === 'number') {
      setScale(customEvent.detail.scale);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      document.documentElement.style.setProperty('--text-scale', String(scale));
      
      // Use debounced save function
      debouncedSaveScale(scale);
      
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent(TEXT_SCALE_EVENT, { detail: { scale } }));
      
      // Create or update live region
      if (!liveRegionRef.current) {
        liveRegionRef.current = document.createElement('div');
        liveRegionRef.current.id = 'text-size-announcement';
        liveRegionRef.current.setAttribute('aria-live', 'polite');
        liveRegionRef.current.setAttribute('aria-atomic', 'true');
        liveRegionRef.current.className = 'sr-only';
        document.body.appendChild(liveRegionRef.current);
      }
      
      // Announce text size change to screen readers only if it actually changed
      if (scale !== lastAnnouncedScale) {
        const announcement = `Text size changed to ${scale === 0.95 ? 'small' : scale === 1 ? 'normal' : scale === 1.15 ? 'large' : 'extra large'}`;
        liveRegionRef.current.textContent = announcement;
        setLastAnnouncedScale(scale);
      }
    }
  }, [scale, isInitialized, debouncedSaveScale, lastAnnouncedScale]);
  
  // Initialize on mount
  useEffect(() => {
    const initializeScale = async () => {
      try {
        const stored = await safeGetItem(KEY, 1);
        const parsed = Number(stored);
        if (Number.isFinite(parsed) && parsed >= 0.9 && parsed <= 1.3) {
          setScale(parsed);
        }
      } catch (error) {
        console.error('Error reading initial text scale:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initializeScale();
    
    // Set up event listener for external scale changes
    eventListenerRef.current = handleTextScaleChange;
    window.addEventListener(TEXT_SCALE_EVENT, eventListenerRef.current);
    
    // Store cleanup function
    cleanupRef.current = cleanup;
    
    // Return cleanup function
    return cleanup;
  }, [cleanup, handleTextScaleChange]);

  return (
    <div className="flex items-center gap-1 rounded-xl bg-pitchBlack/60 p-1" role="group" aria-label="Text size adjustment">
      {options.map((v, index) => (
        <button
          key={v}
          type="button"
          onClick={() => setScale(v)}
          aria-pressed={scale === v}
          aria-label={`Text size ${v === 0.95 ? 'small' : v === 1 ? 'normal' : v === 1.15 ? 'large' : 'extra large'}${scale === v ? ', currently selected' : ''}`}
          className={[
            'rounded-lg px-2 py-1 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-1 focus:ring-offset-pitchBlack',
            scale === v 
              ? 'bg-paleAmber text-pitchBlack shadow-soft ring-2 ring-paleAmber/50' 
              : 'text-vanillaCustard hover:bg-pitchBlack'
          ].join(' ')}
        >
          <span className="flex items-center gap-1">
            {v === 0.95 ? 'A-' : v === 1 ? 'A' : v === 1.15 ? 'A+' : 'A++'}
            {scale === v && (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

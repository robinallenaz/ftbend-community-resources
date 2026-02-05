import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Performance optimization: Use Intersection Observer for scroll detection
const useIntersectionObserver = (callback: () => void, threshold: number = 0.8) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer with optimized options
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold,
        rootMargin: '200px 0px 0px 0px' // Trigger 200px before element comes into view
      }
    );
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, threshold]);
  
  return observerRef;
};



export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  // Performance optimization: Cache DOM elements with regular references
  const elementCache = useRef<Map<string, Element | null>>(new Map());
  
  // Performance optimization: Use Intersection Observer for better scroll performance
  const scrollThreshold = 0.8;
  
  // Optimized element getter with caching and cleanup
  const getElement = useCallback((id: string): Element | null => {
    const cachedElement = elementCache.current.get(id);
    
    if (cachedElement) {
      // Check if cached element is still valid and connected
      if (cachedElement.isConnected && cachedElement.id === id) {
        return cachedElement;
      } else {
        // Remove stale reference
        elementCache.current.delete(id);
      }
    }
    
    // Query fresh element and cache
    try {
      const element = document.getElementById(id);
      if (element?.isConnected && element.id === id) {
        elementCache.current.set(id, element);
        return element;
      }
    } catch (error) {
      console.error(`Error querying element ${id}:`, error);
    }
    
    return null;
  }, []);

  // Optimized scroll visibility calculation
  const calculateScrollVisibility = useCallback(() => {
    const isBlogPost = pathname.startsWith('/blog') && pathname !== '/blog';

    if (isBlogPost) {
      const articleContent = getElement('article-content') as HTMLElement;

      if (articleContent) {
        // Use getBoundingClientRect for better performance than scroll calculations
        const articleRect = articleContent.getBoundingClientRect();
        const articleEndVisible = articleRect.bottom < window.innerHeight + 200;
        return articleEndVisible;
      }
      
      // Fallback: use scroll percentage calculation
      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      return scrollPercent > scrollThreshold;
    } else {
      // Other pages: use fixed threshold
      return window.pageYOffset > 1200;
    }
  }, [pathname, getElement, scrollThreshold]);

  // Performance optimization: Use Intersection Observer for blog posts
  const observerCallback = useCallback(() => {
    const shouldShow = calculateScrollVisibility();
    setIsVisible(shouldShow);
  }, [calculateScrollVisibility]);
  
  const observer = useIntersectionObserver(observerCallback, scrollThreshold);
  
  // Set up observer for blog posts
  useEffect(() => {
    const isBlogPost = pathname.startsWith('/blog') && pathname !== '/blog';
    
    if (isBlogPost) {
      const articleContent = getElement('article-content');
      if (articleContent && observer.current) {
        observer.current.observe(articleContent);
      }
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [pathname, getElement, observer]);



  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Fallback scroll handler for non-blog pages (optimized)
  useEffect(() => {
    const isBlogPost = pathname.startsWith('/blog') && pathname !== '/blog';
    
    if (isBlogPost) {
      return; // Use Intersection Observer for blog posts
    }
    
    let rafId: number | null = null;
    let isTicking = false;
    
    const throttledScrollHandler = () => {
      if (!isTicking) {
        rafId = requestAnimationFrame(() => {
          const shouldShow = calculateScrollVisibility();
          setIsVisible(shouldShow);
          isTicking = false;
          rafId = null;
        });
        isTicking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [pathname, calculateScrollVisibility]);



  // Optimized scroll handler with better performance
  const scrollToTarget = useCallback(() => {
    // Check if we're on the blog submission page
    if (pathname === '/submit' || pathname === '/submit-blog-contribution') {
      const contentTextarea = getElement('content') as HTMLElement;
      if (contentTextarea) {
        contentTextarea.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        // Use requestAnimationFrame for better focus timing
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            contentTextarea.focus();
          });
        });
      }
    } else if (pathname.startsWith('/blog')) {
      // Handle blog pages
      if (pathname !== '/blog') {
        // On individual blog post pages, scroll to top of page
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        return;
      }
      // On blog list page, scroll to search
      const searchInput = getElement('search') as HTMLElement;
      if (searchInput) {
        searchInput.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            searchInput.focus();
          });
        });
      }
    } else if (pathname === '/events' || pathname === '/about') {
      // Handle events/about pages - scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Handle homepage and resources page - scroll to resource search
      const resourceSearchInput = getElement('resource-search') as HTMLElement;
      if (resourceSearchInput) {
        resourceSearchInput.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resourceSearchInput.focus();
          });
        });
      }
    }
  }, [pathname, getElement]);

  // Memoized button label to prevent unnecessary recalculations
  const buttonLabel = useMemo(() => {
    if (pathname === '/submit' || pathname === '/submit-blog-contribution') {
      return 'Scroll to Content';
    } else if (pathname.startsWith('/blog') && pathname !== '/blog') {
      return 'Back to Top'; // Individual blog post pages
    } else if (pathname === '/blog') {
      return 'Back to Search'; // Blog list page
    } else if (pathname === '/events' || pathname === '/about') {
      return 'Back to Top';
    } else {
      return 'Back to Search'; // For homepage and resources page
    }
  }, [pathname]);
  return (

    <button
      onClick={scrollToTarget}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          scrollToTarget();
        }
      }}
      className="
        fixed bottom-8 right-8 z-50
        w-14 h-14
        rounded-full
        bg-gradient-to-r from-paleAmber via-vanillaCustard to-powderBlush
        shadow-lg hover:shadow-xl
        transform transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        flex items-center justify-center
        group
        border border-vanillaCustard/20
        backdrop-blur-sm
        touch-manipulation
      "
      aria-label={buttonLabel}
      title={buttonLabel}
      style={{
        animation: 'fadeInSlideUp 0.4s ease-out'
      }}
    >

      {/* Screen reader only text */}
      <span className="sr-only">{buttonLabel}</span>


      {/* Arrow Icon */}

      <svg

        className="w-5 h-5 md:w-6 md:h-6 text-pitchBlack"

        fill="none"

        stroke="currentColor"

        strokeWidth="2.5"

        strokeLinecap="round"

        strokeLinejoin="round"

        viewBox="0 0 24 24"

      >

        <path d="M18 15l-6-6-6 6" />

      </svg>

      

      {/* Visible text label for better accessibility */}

      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-pitchBlack bg-vanillaCustard/90 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">

        {buttonLabel}

      </span>

      

      {/* Hover effect - subtle glow */}

      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-paleAmber via-vanillaCustard to-powderBlush opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md" />

    </button>

  );

}


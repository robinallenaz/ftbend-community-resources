/**
 * Simple analytics implementation using Microsoft Clarity
 * Microsoft Clarity is now loaded via the official tracking script in index.html
 */

// Check if Clarity is available from the global script
declare global {
  interface Window {
    clarity?: (event: string, ...args: any[]) => void;
  }
}

export async function initializeClarity() {
  // Only enable in production
  if (!import.meta.env.PROD) {
    return;
  }

  // Respect Do Not Track
  if (navigator.doNotTrack === '1') {
    return;
  }

  // Check if Clarity is available from the global script
  if (!window.clarity) {
    return;
  }

  try {
    // Add custom tags for better community insights
    window.clarity('set', 'site-type', 'lgbtqia-community-resources');
    window.clarity('set', 'region', 'fort-bend-county-texas');
    window.clarity('set', 'purpose', 'community-support');
  } catch (error) {
    // Log analytics errors in development for debugging
    if (import.meta.env.DEV) {
      console.warn('Analytics initialization failed:', error);
    }
  }
}

/**
 * Track custom events for community engagement
 */
export async function trackCommunityEvent(action: string, details?: string) {
  if (!import.meta.env.PROD || navigator.doNotTrack === '1') return;
  
  if (!window.clarity) return;
  
  try {
    window.clarity('event', action);
    if (details) {
      window.clarity('set', 'event-details', details);
    }
  } catch (error) {
    // Log analytics errors in development for debugging
    if (import.meta.env.DEV) {
      console.warn('Analytics event tracking failed:', error);
    }
  }
}

/**
 * Track resource searches for insights
 */
export async function trackResourceSearch(category?: string, audience?: string) {
  if (!import.meta.env.PROD || navigator.doNotTrack === '1') return;
  
  if (!window.clarity) return;
  
  try {
    window.clarity('event', 'resource-search');
    if (category) window.clarity('set', 'search-category', category);
    if (audience) window.clarity('set', 'search-audience', audience);
  } catch (error) {
    // Log analytics errors in development for debugging
    if (import.meta.env.DEV) {
      console.warn('Resource search tracking failed:', error);
    }
  }
}

/**
 * Track resource submissions
 */
export async function trackResourceSubmission(type: string) {
  if (!import.meta.env.PROD || navigator.doNotTrack === '1') return;
  
  if (!window.clarity) return;
  
  try {
    window.clarity('event', 'resource-submission');
    window.clarity('set', 'submission-type', type);
  } catch (error) {
    // Log analytics errors in development for debugging
    if (import.meta.env.DEV) {
      console.warn('Resource submission tracking failed:', error);
    }
  }
}

/**
 * Simple privacy notice text - safe for React components
 */
export const PRIVACY_NOTICE_TEXT = "This site uses anonymous usage analytics to improve community resources. Learn more in our privacy policy.";

/**
 * Simple privacy policy section
 */
export const SIMPLE_PRIVACY_NOTICE = `
## Website Analytics

We use Microsoft Clarity to understand how people use this resource directory. 
This helps us improve navigation and accessibility for the Fort Bend County LGBTQIA+ community.

**What we collect:**
- Anonymous click patterns (no personal information)
- General usage statistics
- Device information for accessibility

**What we DON'T collect:**
- Names, emails, or contact information
- IP addresses or location data
- Individual user tracking

**Your choice:**
- No consent required (data is anonymous)
- Use browser Do Not Track to opt out
- Questions? Contact us anytime
`;

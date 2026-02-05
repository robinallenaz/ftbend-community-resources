import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * SEO utilities for managing meta tags
 */

/**
 * Sanitizes content to prevent XSS injection
 * @param content - The content to sanitize
 * @returns Sanitized content
 */
function sanitizeContent(content: string): string {
  // Additional validation for meta content
  if (content.includes('<script') || content.includes('javascript:')) {
    return '';
  }
  
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    SANITIZE_NAMED_PROPS: true
  });
}

/**
 * Safely get document head with comprehensive validation
 */
function getDocumentHead(): HTMLHeadElement | null {
  try {
    // Check if document exists and has proper structure
    if (!document || 
        typeof document !== 'object' ||
        !document.documentElement ||
        document.documentElement.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    const head = document.head;
    if (!head || 
        head.nodeType !== Node.ELEMENT_NODE ||
        head.tagName?.toLowerCase() !== 'head') {
      return null;
    }
    
    return head;
  } catch (error) {
    console.error('Error accessing document head:', error);
    return null;
  }
}

/**
 * Safely validate DOM element to prevent clobbering attacks
 */
function isValidDOMElement(element: any): element is Element {
  return element && 
         typeof element === 'object' &&
         typeof element.nodeType === 'number' &&
         typeof element.tagName === 'string' &&
         typeof element.getAttribute === 'function' &&
         typeof element.setAttribute === 'function';
}

/**
 * Safely validate HTMLCollection and convert to array
 */
function safeHTMLCollectionToArray(collection: any): Element[] {
  if (!collection || typeof collection !== 'object') {
    return [];
  }
  
  try {
    // Check if it's an HTMLCollection
    if (typeof collection.length === 'number' && 
        typeof collection.item === 'function') {
      const result: Element[] = [];
      for (let i = 0; i < collection.length; i++) {
        const item = collection.item(i);
        if (isValidDOMElement(item)) {
          result.push(item);
        }
      }
      return result;
    }
    
    // Fallback to array conversion if possible
    return Array.from(collection).filter(isValidDOMElement);
  } catch (error) {
    console.error('Error converting HTMLCollection to array:', error);
    return [];
  }
}

/**
 * Safely get attribute from element with validation
 */
function safeGetAttribute(element: Element, attr: string): string | null {
  try {
    if (!element || typeof element.getAttribute !== 'function') {
      return null;
    }
    return element.getAttribute(attr);
  } catch (error) {
    console.error(`Error getting attribute ${attr}:`, error);
    return null;
  }
}

/**
 * Updates or creates a meta tag with the given property and content
 * @param property - The meta tag property (e.g., 'og:title', 'twitter:description')
 * @param content - The content for the meta tag
 */
export function updateMetaTag(property: string, content: string): void {
  try {
    // Validate inputs with stricter checks
    if (typeof property !== 'string' || typeof content !== 'string') {
      console.error('Invalid inputs to updateMetaTag');
      return;
    }
    
    // Add length limits to prevent potential attacks
    if (property.length > 100 || content.length > 2000) {
      console.error('Input too long for updateMetaTag');
      return;
    }
    
    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(content);
    
    // Get document head safely
    const head = getDocumentHead();
    if (!head) {
      console.error('Document head not available');
      return;
    }
    
    // Find existing tag using safe DOM methods with comprehensive validation
    let tag: HTMLMetaElement | null = null;
    
    try {
      const metaTags = head.getElementsByTagName('meta');
      const safeMetaTags = safeHTMLCollectionToArray(metaTags);
      
      for (const meta of safeMetaTags) {
        // Additional validation to prevent DOM clobbering
        if (!isValidDOMElement(meta) || meta.tagName?.toLowerCase() !== 'meta') {
          continue;
        }
        
        // Safe property access with type checking
        const metaElement = meta as HTMLMetaElement;
        if (typeof metaElement.getAttribute !== 'function' || 
            typeof metaElement.setAttribute !== 'function') {
          continue;
        }
        
        // Additional validation for attribute values
        if (property.startsWith('twitter:')) {
          const nameAttr = safeGetAttribute(metaElement, 'name');
          if (typeof nameAttr === 'string' && nameAttr === property) {
            tag = metaElement;
            break;
          }
        } else if (property.startsWith('og:')) {
          const propertyAttr = safeGetAttribute(metaElement, 'property');
          if (typeof propertyAttr === 'string' && propertyAttr === property) {
            tag = metaElement;
            break;
          }
        } else {
          // Handle other meta tags
          const nameAttr = safeGetAttribute(metaElement, 'name');
          if (typeof nameAttr === 'string' && nameAttr === property) {
            tag = metaElement;
            break;
          }
        }
      }
      
      if (tag) {
        // Update existing tag
        tag.content = sanitizedContent;
      } else {
        // Create new meta tag
        const newTag = document.createElement('meta');
        
        if (property.startsWith('twitter:')) {
          newTag.setAttribute('name', property);
        } else if (property.startsWith('og:')) {
          newTag.setAttribute('property', property);
        } else {
          newTag.setAttribute('name', property);
        }
        
        newTag.content = sanitizedContent;
        head.appendChild(newTag);
      }
      
    } catch (error) {
      console.error('Error setting meta tag content:', error);
    }
  } catch (error) {
    console.error(`Error updating meta tag ${property}:`, error);
  }
}

/**
 * Updates or creates the canonical URL link tag
 * @param url - The canonical URL
 */
export function updateCanonicalUrl(url: string): void {
  try {
    // Validate URL format with stricter checks
    if (typeof url !== 'string' || !url.trim()) {
      console.error('Invalid URL provided to updateCanonicalUrl');
      return;
    }
    
    // Add length limit to prevent potential attacks
    if (url.length > 2048) {
      console.error('URL too long for updateCanonicalUrl');
      return;
    }
    
    const head = document.head;
    if (!head) {
      console.error('Document head not available');
      return;
    }
    
    // Find existing canonical link using safe attribute access with validation
    const linkTags = head.getElementsByTagName('link');
    let canonical: HTMLLinkElement | null = null;
    
    for (let i = 0; i < linkTags.length; i++) {
      const link = linkTags[i] as HTMLLinkElement;
      // Validate that the link element is valid before accessing properties
      if (!link || !link.tagName || link.tagName.toLowerCase() !== 'link') {
        continue;
      }
      
      // Use safe attribute access to prevent DOM clobbering
      const relAttr = safeGetAttribute(link, 'rel');
      if (relAttr === 'canonical') {
        canonical = link;
        break;
      }
    }
    
    if (!canonical) {
      // Create new canonical link
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      head.appendChild(canonical);
    }
    
    // Set href using direct property access with validation
    if (canonical && 'href' in canonical && typeof canonical.href === 'string') {
      canonical.href = url;
    }
  } catch (error) {
    console.error('Error updating canonical URL:', error);
  }
}

/**
 * Updates the document title
 * @param title - The new document title
 */
export function updateDocumentTitle(title: string): void {
  try {
    // Validate title format with stricter checks
    if (typeof title !== 'string' || !title.trim()) {
      console.error('Invalid title provided to updateDocumentTitle');
      return;
    }
    
    // Add length limit to prevent potential attacks
    if (title.length > 200) {
      console.error('Title too long for updateDocumentTitle');
      return;
    }
    
    // Sanitize content to prevent XSS
    const sanitizedTitle = sanitizeContent(title);
    
    // Validate document object before using it
    if (typeof document !== 'undefined' && document.title !== undefined) {
      document.title = sanitizedTitle;
    }
  } catch (error) {
    console.error('Error updating document title:', error);
  }
}

/**
 * Updates or creates a meta description tag
 * @param description - The meta description content
 */
export function updateMetaDescription(description: string): void {
  try {
    // Validate description format with stricter checks
    if (typeof description !== 'string' || !description.trim()) {
      console.error('Invalid description provided to updateMetaDescription');
      return;
    }
    
    // Add length limit to prevent potential attacks
    if (description.length > 500) {
      console.error('Description too long for updateMetaDescription');
      return;
    }
    
    // Sanitize content to prevent XSS
    const sanitizedDescription = sanitizeContent(description);
    
    const head = document.head;
    if (!head) {
      console.error('Document head not available');
      return;
    }
    
    // Find existing meta description using safe attribute access with validation
    const metaTags = head.getElementsByTagName('meta');
    let metaDesc: HTMLMetaElement | null = null;
    
    for (let i = 0; i < metaTags.length; i++) {
      const meta = metaTags[i] as HTMLMetaElement;
      // Validate that the meta element is valid before accessing properties
      if (!meta || !meta.tagName || meta.tagName.toLowerCase() !== 'meta') {
        continue;
      }
      
      // Use safe attribute access to prevent DOM clobbering
      const nameAttr = safeGetAttribute(meta, 'name');
      if (nameAttr === 'description') {
        metaDesc = meta;
        break;
      }
    }
    
    if (!metaDesc) {
      // Create new meta description
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      head.appendChild(metaDesc);
    }
    
    // Set content using direct property access with validation
    if (metaDesc && 'content' in metaDesc && typeof metaDesc.content === 'string') {
      metaDesc.content = sanitizedDescription;
    }
  } catch (error) {
    console.error('Error updating meta description:', error);
  }
}

/**
 * Cleans up all meta tags created by the SEO utilities
 * @param selectors - Array of CSS selectors for tags to remove
 */
export function cleanupMetaTags(selectors: string[] = []): void {
  try {
    // Validate selectors array
    if (!Array.isArray(selectors)) {
      console.error('Invalid selectors provided to cleanupMetaTags');
      return;
    }
    
    const defaultSelectors = [
      'meta[property^="og:"]',
      'meta[property^="twitter:"]',
      'meta[name="description"]',
      'link[rel="canonical"]'
    ];
    
    const allSelectors = [...defaultSelectors, ...selectors];
    
    allSelectors.forEach(selector => {
      try {
        // Validate selector format
        if (typeof selector !== 'string' || !selector.trim()) {
          console.warn('Invalid selector skipped:', selector);
          return;
        }
        
        const tags = document.querySelectorAll(selector);
        tags.forEach(tag => {
          if (tag && tag.parentNode) {
            tag.parentNode.removeChild(tag);
          }
        });
      } catch (error) {
        console.error(`Error cleaning up selector ${selector}:`, error);
      }
    });
  } catch (error) {
    console.error('Error in cleanupMetaTags:', error);
  }
}

/**
 * Validates and gets the site URL from environment variables
 * @returns The validated base site URL
 */
export function getSiteUrl(): string {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://ftbend-lgbtqia-community.org';
  
  // Validate URL format
  try {
    const url = new URL(siteUrl);
    
    // Ensure it's using a secure protocol
    if (!['https:', 'http:'].includes(url.protocol)) {
      console.warn('Invalid site URL protocol, falling back to default');
      return 'https://ftbend-lgbtqia-community.org';
    }
    
    // Ensure it's a reasonable domain
    if (url.hostname.length < 3 || url.hostname.length > 253) {
      console.warn('Invalid site URL hostname, falling back to default');
      return 'https://ftbend-lgbtqia-community.org';
    }
    
    // Remove trailing slash for consistency
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    console.error('Invalid site URL format, falling back to default:', error);
    return 'https://ftbend-lgbtqia-community.org';
  }
}

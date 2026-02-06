/**
 * Text sanitization utilities to prevent XSS attacks
 * 
 * SECURITY NOTE: This provides basic XSS protection. For comprehensive protection,
 * consider using a dedicated library like DOMPurify in production environments.
 */

/**
 * Sanitize CSS content for style attributes
 * Provides basic CSS injection protection
 */
export function sanitizeCss(css: string): string {
  if (typeof css !== 'string') {
    return '';
  }

  // Remove dangerous CSS constructs
  return css
    .replace(/javascript:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*['"]?\s*javascript:/gi, '')
    .replace(/@import/gi, '')
    .replace(/behavior:/gi, '')
    .replace(/binding:/gi, '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '&amp;lt;')
    .replace(/&gt;/g, '&amp;gt;')
    .replace(/&quot;/g, '&amp;quot;')
    .replace(/&#x27;/g, '&amp;#x27;')
    .replace(/&#x2F;/g, '&amp;#x2F;');
}

/**
 * Sanitize text content by escaping HTML characters
 * This provides basic XSS protection for text content
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Sanitize text for display in code elements
 * Similar to sanitizeText but handles code-specific cases
 */
export function sanitizeCode(text: string): string {
  return sanitizeText(text);
}

/**
 * Create a safe HTML attribute value
 */
export function sanitizeAttribute(text: string): string {
  return sanitizeText(text).replace(/"/g, '&quot;');
}

/**
 * Sanitize URL for safe display
 * Validates URL format and sanitizes for display
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    // Validate URL format first
    const parsedUrl = new URL(url);
    
    // Handle data URLs with strict validation
    if (parsedUrl.protocol === 'data:') {
      // Extract MIME type from data URL properly
      const dataUrl = url.substring(5); // Remove 'data:'
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) {
        return '#invalid-data-format';
      }
      
      const mimeType = dataUrl.substring(0, commaIndex).split(';')[0].toLowerCase().trim();
      const allowedDataTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'text/plain'];
      
      if (!allowedDataTypes.includes(mimeType)) {
        return '#invalid-data-type';
      }
      
      // Additional check for SVG data URLs to prevent script injection
      if (mimeType === 'image/svg+xml') {
        const dataContent = dataUrl.substring(commaIndex + 1);
        
        // Handle multiple encoding formats that could bypass validation
        let decodedContent;
        try {
          // Try standard URI decoding first
          decodedContent = decodeURIComponent(dataContent);
        } catch {
          try {
            // Fallback to base64 decoding if it looks like base64
            decodedContent = atob(dataContent);
          } catch {
            // If both fail, treat as invalid
            return '#invalid-svg-encoding';
          }
        }
        
        // Block SVG content that contains event handlers or scripts
        // More comprehensive patterns to catch various injection attempts
        const dangerousPatterns = [
          // Script and event handlers
          /<script/i,
          /on\w+\s*=/i,  // Matches onclick, onload, onerror, etc.
          /javascript:/i,
          /data:text\/html/i,
          /vbscript:/i,
          
          // Dangerous elements and attributes
          /<iframe/i,
          /<object/i,
          /<embed/i,
          /<form/i,
          /<input/i,
          /<button/i,
          /<link/i,
          /<meta/i,
          /<style/i,
          /@import/i,
          
          // Expression and eval functions
          /eval\s*\(/i,
          /expression\s*\(/i,
          /url\s*\(\s*['"]?\s*javascript:/i,
          /fromCharCode/i,
          /String\.fromCharCode/i,
          
          // XML-specific attacks
          /<\?xml/i,
          /<!DOCTYPE/i,
          /<\!\[CDATA\[/i,
          /xlink:href\s*=/i,
          /href\s*=\s*["']?javascript:/i,
          
          // Common obfuscation patterns
          /\\x[0-9a-f]{2}/i,
          /\\u[0-9a-f]{4}/i,
          /&#\d+;/,
          /&#x[0-9a-f]+;/i,
        ];
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(decodedContent)) {
            return '#invalid-svg-content';
          }
        }
        
        // Additional check: ensure SVG content doesn't contain executable code
        // by looking for common JavaScript patterns in any encoding
        const jsPatterns = [
          /function\s*\(/i,
          /var\s+\w+\s*=/,
          /let\s+\w+\s*=/,
          /const\s+\w+\s*=/,
          /window\./i,
          /document\./i,
          /alert\s*\(/i,
          /console\./i,
        ];
        
        for (const pattern of jsPatterns) {
          if (pattern.test(decodedContent)) {
            return '#invalid-svg-content';
          }
        }
      }
    } else {
      // Only allow safe protocols for non-data URLs
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return '#invalid-protocol';
      }
    }
    
    return sanitizeText(url);
  } catch {
    // Invalid URL format
    return '#invalid-url';
  }
}

/**
 * Sanitize user input for display in text content
 * More aggressive sanitization for user-generated content
 */
export function sanitizeUserInput(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\s]{2,}/g, ' ') // Normalize multiple spaces
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Comprehensive input validation utilities for security and data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * Common dangerous patterns for URL and content validation
 */
const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /data:(?!(image\/(png|jpe?g|gif|webp|svg)|text\/markdown|text\/plain))/i,
  /vbscript:/i,
  /file:/i,
  /ftp:/i,
  /on\w+\s*=/i,
  /<[^>]*(?:script|iframe|object|embed|form|input|meta|link)[^>]*>/i,
  /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/i,
  /expression\s*\(/i,
  /@import/i,
  /%6a%61%76%61%73%63%72%69%70%74/i,
  /%64%61%74%61/i,
  /%76%62%73%63%72%69%70%74/i,
];

/**
 * Common HTML entity patterns
 */
const HTML_ENTITY_PATTERNS = [
  /&#(\d+);/g,
  /&#x([0-9a-fA-F]+);/g,
  /\\u([0-9a-fA-F]{4})/g,
];

/**
 * Decode URLs and HTML entities safely with iteration limits
 */
function safeDecodeUrl(url: string, maxIterations: number = 3): string {
  let decoded = url;
  let iteration = 0;
  
  while (iteration < maxIterations) {
    const previous = decoded;
    
    // Decode URL components
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break; // Stop if decoding fails
    }
    
    // Decode HTML entities
    decoded = decoded
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
    
    // Stop if no changes occurred
    if (decoded === previous) {
      break;
    }
    
    iteration++;
  }
  
  return decoded;
}

/**
 * Validates and sanitizes URLs to prevent XSS and security vulnerabilities
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a string' };
  }
  
  const trimmedUrl = url.trim();
  
  // Length validation with DoS protection
  if (trimmedUrl.length === 0 || trimmedUrl.length > 2048) {
    return { isValid: false, error: 'URL must be between 1 and 2048 characters' };
  }
  
  // CRITICAL FIX: Safe URL decoding with iteration limits
  let decodedUrl: string;
  try {
    decodedUrl = safeDecodeUrl(trimmedUrl);
  } catch (error) {
    return { isValid: false, error: 'URL contains invalid encoding' };
  }
  
  // Block dangerous patterns in both original and decoded URLs
  if (DANGEROUS_PATTERNS.some(pattern => pattern.test(trimmedUrl) || pattern.test(decodedUrl))) {
    return { isValid: false, error: 'URL contains potentially dangerous content' };
  }
  
  // Allow relative URLs (starting with / or ./) with strict validation
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./')) {
    // CRITICAL FIX: Use decoded URL for protocol bypass detection
    const urlToCheck = decodedUrl;
    
    // Only allow safe characters in relative URLs
    if (/[^a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]/.test(trimmedUrl)) {
      return { isValid: false, error: 'Relative URL contains invalid characters' };
    }
    
    // Prevent path traversal in both original and decoded URLs
    if (trimmedUrl.includes('../') || trimmedUrl.includes('..\\') || 
        urlToCheck.includes('../') || urlToCheck.includes('..\\')) {
      return { isValid: false, error: 'URL contains path traversal attempts' };
    }
    
    // CRITICAL FIX: Enhanced protocol bypass prevention using decoded URL
    if (urlToCheck.includes('//')) {
      // Check for protocol bypass patterns with comprehensive detection
      const protocolBypassPatterns = [
        /^\/\//, // Protocol-relative (not allowed)
        /\/\s*[hH][tT][tT][pP][sS]?:\/\//i, // Protocol after slash with spaces
        /\/\s*[jJ][aA][vV][aA][sS][cC][rR][iI][pP][tT]:/i, // JavaScript protocol after slash
        /\/\s*[dD][aA][tT][aA]:/i, // Data protocol after slash
        /\/\s*&#[0-9]+;/i, // HTML entities after slash
        /\/\s*\\u[0-9a-fA-F]{4}/i, // Unicode escapes after slash
        // Additional patterns for encoded bypass attempts
        /\/%[0-9a-fA-F]{2}/i, // Any URL encoding after slash
        /\/\s*\.\s*\//, // Dotted protocol bypass: /. /./
        /\/\s*\.\s*\.\s*\//, // Double dotted bypass
        /\/\s*[\x00-\x1F]/, // Control characters after slash
      ];
      
      if (protocolBypassPatterns.some(pattern => pattern.test(urlToCheck))) {
        return { isValid: false, error: 'URL contains potentially unsafe protocol bypass attempt' };
      }
      
      // CRITICAL FIX: More sophisticated slash pattern analysis using decoded URL
      const segments = urlToCheck.split('/');
      const consecutiveSlashes = urlToCheck.match(/\/+/g);
      
      // Allow reasonable number of slashes based on URL structure
      if (consecutiveSlashes && consecutiveSlashes.length > 4) {
        return { isValid: false, error: 'URL contains suspicious slash patterns' };
      }
      
      // Check for suspicious segment patterns in decoded URL
      const suspiciousSegments = segments.filter(segment => 
        segment.length > 50 || // Very long segments
        segment.includes('..') || // Path traversal attempts
        segment.includes('%2e%2e') || // Encoded path traversal
        segment.includes('\\') || // Backslash attempts
        /%[0-9a-fA-F]{2}/i.test(segment) || // URL encoded segments in relative URLs
        /javascript:/i.test(segment) || // JavaScript in segment
        /data:/i.test(segment) || // Data protocol in segment
        /<script/i.test(segment) || // Script tags in segment
        /on\w+\s*=/i.test(segment) // Event handlers in segment
      );
      
      if (suspiciousSegments.length > 0) {
        return { isValid: false, error: 'URL contains suspicious path segments' };
      }
    }
    
    return { isValid: true, sanitizedValue: trimmedUrl };
  }
  
  // For absolute URLs, use strict whitelist approach with decoded URL validation
  const urlToCheck = decodedUrl; // Use decoded URL for absolute URL validation
  const urlPattern = /^https:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61})?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?(?:\?[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?(?:#[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?$/;
  
  if (!urlPattern.test(urlToCheck)) {
    return { isValid: false, error: 'URL format is invalid. Only HTTPS URLs are allowed' };
  }
  
  // Additional domain validation using decoded URL
  const domainMatch = urlToCheck.match(/^https:\/\/([^\/:]+)/i);
  if (domainMatch) {
    const domain = domainMatch[1].toLowerCase();
    
    // Strict domain validation
    if (!/^[a-zA-Z0-9.-]+$/.test(domain) || 
        domain.startsWith('.') || 
        domain.endsWith('.') || 
        domain.includes('..') ||
        domain.length > 253) {
      return { isValid: false, error: 'Domain format is invalid' };
    }
    
    // Prevent suspicious TLDs
    const tld = domain.split('.').pop();
    if (!tld || !/^[a-zA-Z]{2,}$/.test(tld)) {
      return { isValid: false, error: 'Top-level domain is invalid' };
    }
    
    // Block known suspicious domains
    const suspiciousDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'test',
      'dev',
      'local'
    ];
    
    if (suspiciousDomains.includes(domain) || domain.includes('.local') || domain.includes('.test')) {
      return { isValid: false, error: 'Domain is not allowed' };
    }
  }
  
  return { isValid: true, sanitizedValue: trimmedUrl };
}

/**
 * Validates email addresses with strict security checks
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string' };
  }
  
  const trimmedEmail = email.trim();
  
  // Length validation
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email must be between 1 and 254 characters' };
  }
  
  // Basic email pattern with strict validation
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailPattern.test(trimmedEmail)) {
    return { isValid: false, error: 'Email format is invalid' };
  }
  
  // Additional security checks
  const [localPart, domain] = trimmedEmail.split('@');
  
  // Validate local part
  if (!localPart || localPart.length > 64) {
    return { isValid: false, error: 'Email local part is invalid' };
  }
  
  // Prevent dangerous patterns in local part
  if (/[<>:"\\|?*]/.test(localPart)) {
    return { isValid: false, error: 'Email contains invalid characters' };
  }
  
  // Validate domain
  if (!domain || domain.length > 253) {
    return { isValid: false, error: 'Email domain is invalid' };
  }
  
  // Prevent suspicious domains
  const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (suspiciousDomains.includes(domain.toLowerCase())) {
    return { isValid: false, error: 'Email domain is not allowed' };
  }
  
  return { isValid: true, sanitizedValue: trimmedEmail.toLowerCase() };
}

/**
 * Validates text content to prevent XSS and injection attacks
 */
export function validateTextContent(content: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  allowMarkdown?: boolean;
} = {}): ValidationResult {
  const { maxLength = 10000, allowHtml = false, allowMarkdown = false } = options;
  
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Content must be a string' };
  }
  
  const trimmedContent = content.trim();
  
  // Length validation
  if (trimmedContent.length > maxLength) {
    return { isValid: false, error: `Content exceeds maximum length of ${maxLength} characters` };
  }
  
  // Block dangerous patterns - refined to reduce false positives
  if (DANGEROUS_PATTERNS.some(pattern => pattern.test(trimmedContent))) {
    return { isValid: false, error: 'Content contains potentially dangerous elements' };
  }
  
  // Additional HTML validation if not allowed
  if (!allowHtml) {
    const htmlTagPattern = /<[^>]*>/gi;
    if (htmlTagPattern.test(trimmedContent)) {
      return { isValid: false, error: 'HTML tags are not allowed in this content' };
    }
  }
  
  // Markdown-specific validation
  if (allowMarkdown) {
    // Check for potentially dangerous markdown links
    const dangerousMarkdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = trimmedContent.match(dangerousMarkdownPattern);
    
    if (matches) {
      for (const match of matches) {
        const urlMatch = match.match(/\(([^)]+)\)/);
        if (urlMatch) {
          const urlValidation = validateUrl(urlMatch[1]);
          if (!urlValidation.isValid) {
            return { isValid: false, error: `Markdown link contains invalid URL: ${urlValidation.error}` };
          }
        }
      }
    }
  }
  
  return { isValid: true, sanitizedValue: trimmedContent };
}

/**
 * Validates category names with specific requirements
 */
export function validateCategory(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Category must be a string' };
  }
  
  const trimmedName = name.trim();
  
  // Length validation
  if (trimmedName.length === 0 || trimmedName.length > 50) {
    return { isValid: false, error: 'Category must be between 1 and 50 characters' };
  }
  
  // Categories should be more formal - allow letters, numbers, spaces, hyphens, and ampersands
  const validPattern = /^[a-zA-Z0-9\s\-&]+$/;
  if (!validPattern.test(trimmedName)) {
    return { isValid: false, error: 'Category contains invalid characters' };
  }
  
  // Categories should not be single characters (except for special cases)
  if (trimmedName.length === 1 && !['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].includes(trimmedName.toUpperCase())) {
    return { isValid: false, error: 'Category must be at least 2 characters long' };
  }
  
  // Prevent XSS and injection attempts
  if (DANGEROUS_PATTERNS.some(pattern => pattern.test(trimmedName))) {
    return { isValid: false, error: 'Category contains potentially dangerous content' };
  }
  
  return { isValid: true, sanitizedValue: trimmedName };
}

/**
 * Validates tag names with more flexible requirements
 */
export function validateTag(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Tag must be a string' };
  }
  
  const trimmedName = name.trim();
  
  // Length validation - tags can be shorter
  if (trimmedName.length === 0 || trimmedName.length > 30) {
    return { isValid: false, error: 'Tag must be between 1 and 30 characters' };
  }
  
  // Tags can be more flexible - allow letters, numbers, spaces, hyphens, ampersands, and basic punctuation
  const validPattern = /^[a-zA-Z0-9\s\-&'.,#]+$/;
  if (!validPattern.test(trimmedName)) {
    return { isValid: false, error: 'Tag contains invalid characters' };
  }
  
  // Tags can be single characters (like 'C' for 'Community')
  
  // Prevent XSS and injection attempts
  if (DANGEROUS_PATTERNS.some(pattern => pattern.test(trimmedName))) {
    return { isValid: false, error: 'Tag contains potentially dangerous content' };
  }
  
  return { isValid: true, sanitizedValue: trimmedName };
}

/**
 * Validates blog post titles
 */
export function validateTitle(title: string): ValidationResult {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Title must be a string' };
  }
  
  const trimmedTitle = title.trim();
  
  // Length validation
  if (trimmedTitle.length === 0 || trimmedTitle.length > 200) {
    return { isValid: false, error: 'Title must be between 1 and 200 characters' };
  }
  
  // Basic content validation
  const contentValidation = validateTextContent(trimmedTitle, { 
    maxLength: 200, 
    allowHtml: false, 
    allowMarkdown: false 
  });
  
  if (!contentValidation.isValid) {
    return contentValidation;
  }
  
  return { isValid: true, sanitizedValue: trimmedTitle };
}

/**
 * Validates image URLs with additional checks
 */
export function validateImageUrl(url: string): ValidationResult {
  const urlValidation = validateUrl(url);
  
  if (!urlValidation.isValid) {
    return urlValidation;
  }
  
  const sanitizedUrl = urlValidation.sanitizedValue!;
  
  // Additional image-specific validation
  const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasImageExtension = allowedImageExtensions.some(ext => 
    sanitizedUrl.toLowerCase().includes(ext)
  );
  
  // Allow Cloudinary URLs and other image hosting services
  const allowedImageHosts = [
    'cloudinary.com',
    'images.unsplash.com',
    'i.imgur.com',
    'cdn.pixabay.com',
    'images.pexels.com'
  ];
  
  let urlObj: URL;
  try {
    urlObj = new URL(sanitizedUrl);
  } catch (error) {
    return { isValid: false, error: 'URL format is invalid' };
  }
  
  const isAllowedHost = allowedImageHosts.some(host => 
    urlObj.hostname.includes(host)
  );
  
  if (!hasImageExtension && !isAllowedHost) {
    return { 
      isValid: false, 
      error: 'URL must point to an image file or use an approved image hosting service' 
    };
  }
  
  return { isValid: true, sanitizedValue: sanitizedUrl };
}

/**
 * Sanitizes and validates user input comprehensively
 */
export function sanitizeInput(input: any, type: 'text' | 'email' | 'url' | 'title' | 'category' | 'tag' | 'imageUrl' = 'text', options?: any): ValidationResult {
  if (input === null || input === undefined) {
    return { isValid: false, error: 'Input cannot be null or undefined' };
  }
  
  const stringValue = String(input);
  
  switch (type) {
    case 'email':
      return validateEmail(stringValue);
    case 'url':
      return validateUrl(stringValue);
    case 'title':
      return validateTitle(stringValue);
    case 'category':
      return validateCategory(stringValue);
    case 'tag':
      return validateTag(stringValue);
    case 'imageUrl':
      return validateImageUrl(stringValue);
    case 'text':
    default:
      return validateTextContent(stringValue, options);
  }
}

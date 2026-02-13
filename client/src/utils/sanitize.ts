/**
 * Text sanitization utilities to prevent XSS attacks
 * 
 * SECURITY NOTE: This provides basic XSS protection. For comprehensive protection,
 * consider using a dedicated library like DOMPurify in production environments.
 */

import { validateUrl } from './validationUtils';

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
  
  // Add DoS protection
  if (text.length > 10000) {
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
 * Sanitize URL for safe display and validation
 * Uses the consolidated validateUrl function for consistency
 */
export function sanitizeUrl(url: string): string {
  const validation = validateUrl(url);
  
  if (!validation.isValid) {
    return '#invalid-url';
  }
  
  // Additional sanitization for display
  return validation.sanitizedValue!
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for display in text content
 * More aggressive sanitization for user-generated content
 */
export function sanitizeUserInput(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Add DoS protection
  if (text.length > 10000) {
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

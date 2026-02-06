/**
 * JWT token management utilities
 * 
 * SECURITY WARNING: These functions only parse JWT tokens for basic validation.
 * They do NOT verify the token signature and should NOT be used for authentication.
 * Always verify tokens on the server side with proper signature validation.
 */

interface TokenPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseTokenPayload(token);
    if (!payload || !payload.exp) {
      return true; // Invalid token structure
    }
    
    // Add 60-second buffer to account for clock skew and network latency
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + 60;
  } catch {
    return true; // Invalid token
  }
}

/**
 * Parse JWT token payload
 */
export function parseTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    
    // Basic validation for payload length
    if (payload.length === 0) {
      return null;
    }
    
    // Convert URL-safe base64 to standard base64 if needed
    let normalizedPayload = payload;
    if (payload.includes('-') || payload.includes('_')) {
      normalizedPayload = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    }
    
    // Ensure payload only contains valid base64 characters and proper padding
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedPayload)) {
      return null;
    }
    
    // Validate base64 padding - length should be divisible by 4
    // Add padding if missing (common in URL-safe base64)
    while (normalizedPayload.length % 4 !== 0) {
      normalizedPayload += '=';
    }
    
    // Check for line breaks or other invalid characters
    if (normalizedPayload.includes('\n') || normalizedPayload.includes('\r') || normalizedPayload.includes(' ')) {
      return null;
    }
    
    // Proper base64 decoding with error handling
    let decoded: string;
    try {
      decoded = atob(normalizedPayload);
    } catch (base64Error) {
      return null; // Invalid base64
    }
    
    const parsed = JSON.parse(decoded) as TokenPayload;
    
    // Validate required fields
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    
    if (typeof parsed.id !== 'string' || 
        typeof parsed.email !== 'string' || 
        typeof parsed.iat !== 'number' || 
        typeof parsed.exp !== 'number') {
      return null;
    }
    
    // Additional validation for reasonable timestamp values
    const now = Math.floor(Date.now() / 1000);
    if (parsed.iat > now || parsed.exp < parsed.iat) {
      return null; // Invalid timestamps
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Get valid auth token from localStorage
 */
export function getValidAuthToken(): string | null {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }
    
    if (isTokenExpired(token)) {
      localStorage.removeItem('authToken');
      return null;
    }
    
    return token;
  } catch {
    return null;
  }
}

/**
 * Set auth token with validation
 */
export function setAuthToken(token: string): boolean {
  try {
    if (!token || isTokenExpired(token)) {
      return false;
    }
    
    localStorage.setItem('authToken', token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem('authToken');
  } catch {
    // Ignore errors
  }
}

import { marked } from '../utils/markedConfig';
import DOMPurify from 'dompurify';
import { validateUrl } from '../utils/validationUtils';
import ErrorBoundary from './ErrorBoundary';

// Configure DOMPurify for strict security
const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
    'div', 'span',
    'hr'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'class', 'id'
  ],
  // Strict URL validation - only allow HTTPS and safe relative URLs, no protocol bypass
  ALLOWED_URI_REGEXP: /^https:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?(?:\?[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?(?:#[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?$|^\/(?:[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*|\.\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)*$/,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button', 'style', 'link', 'meta', 'svg', 'math'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'style', 'src', 'data-', 'xlink:href', 'xmlns'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true, // Set to true to preserve safe content while removing malicious elements
  // Additional security measures
  FORBID_SCRIPT: true,
  SANITIZE_NAMED_PROPS: true,
  SANITIZE_NAMED_PROPS_WITH_PREFIX: ['data'],
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  // Remove ADD_URI_SAFE_ATTR to ensure strict URL validation
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: null,
    attributeNameCheck: null,
    allowCustomizedBuiltInElements: false
  }
};



export function processExtendedMarkdown(markdown: string) {
  try {
    // Simple markdown processing - just convert basic markdown to HTML
    let processed = markdown;
    
    // Convert blockquotes (handle multi-line)
    processed = processed.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    processed = processed.replace(/(<\/blockquote>)\s*<blockquote>/g, ' ');
    processed = processed.replace(/<blockquote>(.*?)<\/blockquote>\s*<blockquote>(.*?)<\/blockquote>/g, '<blockquote>$1 $2</blockquote>');
    
    // Convert horizontal rules
    processed = processed.replace(/^---$/gm, '<hr>');
    
    // Convert headers
    processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processed = processed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processed = processed.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert links with proper URL validation
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      // Validate the URL using the comprehensive validation utility
      const urlValidation = validateUrl(url);
      if (urlValidation.isValid) {
        // Sanitize the link text as well
        const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        return `<a href="${urlValidation.sanitizedValue}" rel="noopener noreferrer">${sanitizedText}</a>`;
      } else {
        // If URL is invalid, return just the text without the link
        const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        return sanitizedText;
      }
    });
    
    // Convert bold and italic
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert line breaks
    processed = processed.replace(/\n\n/g, '</p><p>');
    processed = processed.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    processed = '<p>' + processed + '</p>';
    
    // Clean up double paragraphs
    processed = processed.replace(/<p><\/p>/g, '');
    processed = processed.replace(/<p>(<h[1-6]>)/g, '$1');
    processed = processed.replace(/(<\/h[1-6]>)<\/p><p>/g, '$1<p>');
    processed = processed.replace(/<p>(<hr>)/g, '$1<p>');
    processed = processed.replace(/(<hr>)<\/p><p>/g, '$1<p>');
    processed = processed.replace(/<p>(<blockquote>)/g, '$1<p>');
    processed = processed.replace(/(<\/blockquote>)<\/p><p>/g, '$1<p>');
    
    return DOMPurify.sanitize(processed, purifyConfig);
  } catch (error) {
    console.error('Error processing markdown:', error);
    return DOMPurify.sanitize('<p>Content temporarily unavailable.</p>', purifyConfig);
  }
}



export default function MarkdownProcessor({ content }: { content: string }) {
  const processedHtml = processExtendedMarkdown(content);
  return (
    <ErrorBoundary>
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
    </ErrorBoundary>
  );
}


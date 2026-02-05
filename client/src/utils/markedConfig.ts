import { marked } from 'marked';

// Centralized marked configuration for consistent markdown rendering
export function configureMarked() {
  marked.setOptions({
    breaks: true,
    gfm: true,
    async: false,
    // Preserve whitespace in text nodes
    renderer: new marked.Renderer()
  });
  
  // Add additional security by disabling dangerous extensions
  marked.use({
    extensions: [] // No custom extensions for security
  });
}

// Initialize marked configuration
configureMarked();

export { marked };

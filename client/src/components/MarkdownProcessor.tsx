import { marked } from 'marked';

// Configure marked for better markdown rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

export function processExtendedMarkdown(markdown: string) {
  let processed = markdown;
  
  // Alert blocks: !!! info This is important
  processed = processed.replace(
    /!!!\s*(warning|info|success|error|tip)\s*\n([\s\S]*?)(?=\n\n|\n!!!|$)/g,
    (match: string, type: string, content: string) => {
      const icons: Record<string, string> = {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✅',
        error: '❌',
        tip: '💡'
      };
      
      return `<div class="alert alert-${type}" role="alert">
        <div class="alert-icon">${icons[type] || 'ℹ️'}</div>
        <div class="alert-content">${marked(content.trim())}</div>
      </div>`;
    }
  );
  
  return marked(processed);
}

export default function MarkdownProcessor({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: processExtendedMarkdown(content) }} />;
}

export default function KeyboardShortcuts() {
  const shortcuts = [
    { key: 'L', section: 'Location' },
    { key: 'T', section: 'Resource Type' },
    { key: 'A', section: 'Audience' },
  ];

  return (
    <div className="text-xs text-vanillaCustard/50 flex items-center gap-4 pb-1">
      <span className="font-semibold">Quick jumps:</span>
      {shortcuts.map((shortcut) => (
        <span key={shortcut.key} className="flex items-center gap-1 relative">
          <kbd className="font-mono text-vanillaCustard/70 bg-graphite/60 px-1.5 py-0.5 rounded border border-vanillaCustard/20">
            {shortcut.key}
          </kbd>
          <span>{shortcut.section}</span>
        </span>
      ))}
    </div>
  );
}

import { useEffect, useRef } from 'react';

type Option = { label: string; value: string };

export default function FilterGroup(args: {
  title: string;
  description?: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  shortcutKey?: string;
}) {
  const { title, description, options, selected, onToggle, shortcutKey } = args;
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (!shortcutKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger when not focused on input elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key.toLowerCase() === shortcutKey.toLowerCase() && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        fieldsetRef.current?.focus();
        // Focus first checkbox
        const firstCheckbox = fieldsetRef.current?.querySelector('input[type="checkbox"]') as HTMLInputElement;
        firstCheckbox?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey]);

  return (
    <fieldset 
      ref={fieldsetRef}
      className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-3 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack"
      tabIndex={shortcutKey ? 0 : -1}
    >
      <legend className="mb-1">
        <div className="flex items-center gap-2">
          <div className="text-lg font-extrabold text-vanillaCustard relative -translate-y-1">{title}</div>
          {shortcutKey && (
            <kbd className="text-sm font-mono text-vanillaCustard/50 bg-gradient-to-br from-graphite/70 to-graphite/50 w-6 h-6 flex items-center justify-center rounded border border-vanillaCustard/20 shadow-sm relative -translate-y-1">
              {shortcutKey}
            </kbd>
          )}
        </div>
        {description ? <div className="text-sm text-vanillaCustard/75">{description}</div> : null}
      </legend>

      <div className="grid gap-2" role="group" aria-label={`${title} filters`}>
        {options.map((o) => {
          const id = `${title}-${o.value}`.replace(/\s+/g, '-').toLowerCase();
          const checked = selected.has(o.value);
          return (
            <label
              key={o.value}
              htmlFor={id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-vanillaCustard/15 bg-graphite/60 px-3 py-2 hover:border-vanillaCustard/35 focus-within:ring-2 focus-within:ring-paleAmber focus-within:ring-offset-2 focus-within:ring-offset-pitchBlack transition"
            >
              <span className="text-base font-semibold text-vanillaCustard">{o.label}</span>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="h-5 w-5 accent-paleAmber focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

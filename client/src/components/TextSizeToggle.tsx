import { useEffect, useMemo, useState } from 'react';

const KEY = 'ftbend_text_scale';

export default function TextSizeToggle() {
  const [scale, setScale] = useState<number>(() => {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? Number(raw) : 1;
    if (!Number.isFinite(parsed) || parsed < 0.9 || parsed > 1.3) return 1;
    return parsed;
  });

  const options = useMemo(() => [0.95, 1, 1.15, 1.25], []);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(scale));
    localStorage.setItem(KEY, String(scale));
  }, [scale]);

  return (
    <div className="flex items-center gap-1 rounded-xl bg-pitchBlack/60 p-1" aria-label="Text size">
      {options.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setScale(v)}
          aria-pressed={scale === v}
          className={[
            'rounded-lg px-2 py-1 text-sm font-bold transition',
            scale === v ? 'bg-paleAmber text-pitchBlack' : 'text-vanillaCustard hover:bg-pitchBlack'
          ].join(' ')}
        >
          {v === 0.95 ? 'A-' : v === 1 ? 'A' : v === 1.15 ? 'A+' : 'A++'}
        </button>
      ))}
    </div>
  );
}

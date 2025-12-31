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
    <div className="flex items-center gap-1 rounded-xl bg-pitchBlack/60 p-1" role="group" aria-label="Text size adjustment">
      {options.map((v, index) => (
        <button
          key={v}
          type="button"
          onClick={() => setScale(v)}
          aria-pressed={scale === v}
          aria-label={`Text size ${v === 0.95 ? 'small' : v === 1 ? 'normal' : v === 1.15 ? 'large' : 'extra large'}`}
          className={[
            'rounded-lg px-2 py-1 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-1 focus:ring-offset-pitchBlack',
            scale === v ? 'bg-paleAmber text-pitchBlack' : 'text-vanillaCustard hover:bg-pitchBlack'
          ].join(' ')}
        >
          {v === 0.95 ? 'A-' : v === 1 ? 'A' : v === 1.15 ? 'A+' : 'A++'}
        </button>
      ))}
    </div>
  );
}

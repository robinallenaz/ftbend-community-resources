import { useEffect, useState } from 'react';

export default function SkipLink() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <a
      href="#main"
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
        rounded-xl bg-powderBlush px-4 py-2 text-base font-extrabold 
        text-pitchBlack shadow-soft transition z-50
        focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite
        ${isFocused ? 'opacity-100' : 'opacity-0'}
      `}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      Skip to main content
    </a>
  );
}

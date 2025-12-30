export default function Tag({ children, tone }: { children: string; tone?: 'accent' | 'primary' }) {
  const base = 'inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold';
  if (tone === 'primary') {
    return <span className={[base, 'bg-powderBlush text-pitchBlack'].join(' ')}>{children}</span>;
  }
  return <span className={[base, 'bg-paleAmber text-pitchBlack'].join(' ')}>{children}</span>;
}

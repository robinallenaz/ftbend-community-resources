import { type TagTone } from '../utils/tagColors';

export default function Tag({ children, tone }: { children: string; tone?: TagTone }) {
  const base = 'inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold';
  
  const colorClasses = {
    accent: 'bg-paleAmber text-pitchBlack',
    primary: 'bg-powderBlush text-pitchBlack',
    lavender: 'bg-lavenderMist text-pitchBlack',
    sky: 'bg-skyBlue text-pitchBlack',
    mint: 'bg-mintGreen text-pitchBlack',
    coral: 'bg-coralPink text-pitchBlack',
    periwinkle: 'bg-periwinkle text-pitchBlack',
    peach: 'bg-peach text-pitchBlack',
    sage: 'bg-sage text-pitchBlack',
    rose: 'bg-rose text-pitchBlack',
    teal: 'bg-teal text-pitchBlack',
    mauve: 'bg-mauve text-pitchBlack'
  };

  const className = [base, colorClasses[tone || 'accent']].join(' ');
  
  return <span className={className}>{children}</span>;
}

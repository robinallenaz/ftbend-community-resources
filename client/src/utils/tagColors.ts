type TagTone = 'accent' | 'primary' | 'lavender' | 'sky' | 'mint' | 'coral' | 'periwinkle' | 'peach' | 'sage' | 'rose' | 'teal' | 'mauve';

export function getTagColor(tag: string, category: 'location' | 'type' | 'audience'): TagTone {
  // Location colors
  if (category === 'location') {
    if (tag.includes('Fort Bend')) return 'primary';
    if (tag.includes('Houston')) return 'sky';
    if (tag.includes('Sugar Land')) return 'mint';
    if (tag.includes('Richmond')) return 'coral';
    if (tag.includes('Rosenberg')) return 'periwinkle';
    if (tag.includes('Katy')) return 'peach';
    if (tag.includes('Missouri City')) return 'teal';
    return 'sage';
  }
  
  // Type colors
  if (category === 'type') {
    if (tag.includes('Healthcare')) return 'coral';
    if (tag.includes('Legal')) return 'sky';
    if (tag.includes('Support')) return 'mint';
    if (tag.includes('Community')) return 'rose';
    if (tag.includes('Education')) return 'lavender';
    if (tag.includes('Mental Health')) return 'teal';
    if (tag.includes('Social')) return 'peach';
    if (tag.includes('Crisis')) return 'coral';
    if (tag.includes('Financial')) return 'sky';
    if (tag.includes('Housing')) return 'sage';
    return 'primary';
  }
  
  // Audience colors
  if (category === 'audience') {
    if (tag.includes('Youth')) return 'mint';
    if (tag.includes('Adults')) return 'sky';
    if (tag.includes('Seniors')) return 'sage';
    if (tag.includes('Family')) return 'coral';
    if (tag.includes('Trans')) return 'lavender';
    if (tag.includes('Non-binary')) return 'periwinkle';
    if (tag.includes('Queer')) return 'rose';
    if (tag.includes('Lesbian')) return 'peach';
    if (tag.includes('Gay')) return 'teal';
    if (tag.includes('Bisexual')) return 'mauve';
    return 'accent';
  }
  
  return 'accent';
}

export type { TagTone };

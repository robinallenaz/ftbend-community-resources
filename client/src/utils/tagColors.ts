type TagTone = 'accent' | 'primary' | 'lavender' | 'sky' | 'mint' | 'coral' | 'periwinkle' | 'peach' | 'sage' | 'rose' | 'teal' | 'mauve';

export function getTagColor(tag: string, category: 'location' | 'type' | 'audience'): TagTone {
  // Location colors - use more blues and greens
  if (category === 'location') {
    if (tag.includes('Fort Bend')) return 'sky'; // Changed from pink
    if (tag.includes('Houston')) return 'teal';
    if (tag.includes('Sugar Land')) return 'mint';
    if (tag.includes('Richmond')) return 'sage';
    if (tag.includes('Rosenberg')) return 'lavender';
    if (tag.includes('Katy')) return 'periwinkle';
    if (tag.includes('Missouri City')) return 'mauve';
    return 'accent'; // Yellow for other locations
  }
  
  // Type colors - distribute colors more evenly
  if (category === 'type') {
    if (tag.includes('Healthcare')) return 'coral';
    if (tag.includes('Medical')) return 'coral';
    if (tag.includes('Legal')) return 'sky';
    if (tag.includes('Support')) return 'sage'; // Changed from mint
    if (tag.includes('Community')) return 'lavender'; // Changed from rose
    if (tag.includes('Education')) return 'mint';
    if (tag.includes('Mental Health')) return 'teal';
    if (tag.includes('Social')) return 'peach';
    if (tag.includes('Crisis')) return 'coral';
    if (tag.includes('Financial')) return 'periwinkle';
    if (tag.includes('Housing')) return 'mauve';
    return 'primary'; // Pink only for fallback
  }
  
  // Audience colors - use more variety
  if (category === 'audience') {
    if (tag.includes('Youth')) return 'mint';
    if (tag.includes('Adults')) return 'sky';
    if (tag.includes('Seniors')) return 'sage';
    if (tag.includes('Family')) return 'peach'; // Changed from coral
    if (tag.includes('Trans')) return 'lavender';
    if (tag.includes('Non-binary')) return 'periwinkle';
    if (tag.includes('Queer')) return 'rose';
    if (tag.includes('Lesbian')) return 'teal';
    if (tag.includes('Gay')) return 'mauve';
    if (tag.includes('Bisexual')) return 'coral';
    return 'accent'; // Yellow for other audiences
  }
  
  return 'accent';
}

export type { TagTone };

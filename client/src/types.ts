export type ResourceLocation = 'Fort Bend' | 'Houston' | 'Virtual' | 'South TX' | 'Other TX';

export type ResourceType =
  | 'Mental Health'
  | 'Legal'
  | 'Self Care'
  | 'Faith'
  | 'Business'
  | 'Community'
  | 'Pride Orgs'
  | 'Arts'
  | 'Youth'
  | 'Family'
  | 'Events';

export type AudienceTag = 'Trans' | 'Youth' | 'Seniors' | 'Families' | 'All';

export type Resource = {
  id: string;
  name: string;
  description: string;
  url: string;
  locations: ResourceLocation[];
  types: ResourceType[];
  audiences: AudienceTag[];
  tags: string[];
};

export type EventListing = {
  id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
};

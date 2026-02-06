// @deprecated - Use dynamic taxonomy system via TaxonomyItem instead
export type ResourceLocation = 'Fort Bend' | 'Houston' | 'Virtual' | 'South TX' | 'TX';

// @deprecated - Use dynamic taxonomy system via TaxonomyItem instead  
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
  | 'Events'
  | 'Medical';

// @deprecated - Use dynamic taxonomy system via TaxonomyItem instead
export type AudienceTag = 'Trans' | 'Youth' | 'Seniors' | 'Families' | 'All';

// Dynamic taxonomy types for admin-managed system
export type TaxonomyType = 'location' | 'resourceType' | 'audience';

export interface TaxonomyItem {
  _id: string;
  type: TaxonomyType;
  value: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // MongoDB ObjectId reference
}

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationData = {
  name: ResourceLocation;
  coordinates: Coordinates;
  radius: number; // miles
};

export type Resource = {
  id: string;
  name: string;
  description: string;
  url: string;
  phone?: string; // Optional phone number for click-to-call
  locations: ResourceLocation[];
  types: ResourceType[];
  audiences: AudienceTag[];
  tags: string[];
  coordinates?: Coordinates; // Optional specific coordinates for precise location
};

export type EventListing = {
  id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
};

export type NewsletterSubscriber = {
  _id: string;
  email: string;
  source: string;
  status: 'active' | 'unsubscribed';
  createdAt: string;
};

export type NewsletterCampaign = {
  _id: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  status: 'draft' | 'sending' | 'sent';
  sentAt?: string;
  sentCount: number;
  error?: string;
  createdByUserId: {
    _id: string;
    email: string;
  };
  createdAt: string;
};

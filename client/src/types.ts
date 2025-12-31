export type ResourceLocation = 'Fort Bend' | 'Houston' | 'Virtual' | 'South TX' | 'TX';

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

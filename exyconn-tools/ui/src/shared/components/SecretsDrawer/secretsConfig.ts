export interface SecretField {
  key: string;
  label: string;
  storageKey: string;
  placeholder: string;
  instruction: string;
  helpUrl: string;
  category: string;
}

export const secretsConfig: SecretField[] = [
  {
    key: 'openai_api_key',
    label: 'OpenAI API Key',
    storageKey: 'openai_api_key',
    placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    category: 'AI Tools',
    instruction:
      '1. Go to platform.openai.com and sign in\n2. Click on "API Keys" in the left sidebar\n3. Click "Create new secret key"\n4. Copy the key (it starts with sk-)',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'google_maps_api_key',
    label: 'Google Maps API Key',
    storageKey: 'lead-generator-api-settings',
    placeholder: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    category: 'Lead Generator',
    instruction:
      '1. Go to console.cloud.google.com\n2. Create a new project or select an existing one\n3. Enable "Maps JavaScript API"\n4. Go to Credentials → Create Credentials → API Key\n5. Copy the API key',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    key: 'google_places_api_key',
    label: 'Google Places API Key',
    storageKey: 'lead-generator-api-settings',
    placeholder: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    category: 'Lead Generator',
    instruction:
      '1. Go to console.cloud.google.com\n2. Enable "Places API" and "Places API (New)"\n3. Go to Credentials → Create Credentials → API Key\n4. Copy the API key (can be same as Maps key)',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    key: 'removebg_api_key',
    label: 'Remove.bg API Key',
    storageKey: 'removebg_api_key',
    placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX',
    category: 'Logo Set',
    instruction:
      '1. Go to remove.bg and sign in\n2. Open Tools → API → API Keys\n3. Create a new API key\n4. Copy the key (the free tier includes 50 previews a month)',
    helpUrl: 'https://www.remove.bg/dashboard#api-key',
  },
  {
    key: 'google_search_api_key',
    label: 'Google Custom Search API Key',
    storageKey: 'google_search_api_key',
    placeholder: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    category: 'SEO Tools',
    instruction:
      '1. Go to console.cloud.google.com\n2. Enable "Custom Search API"\n3. Go to Credentials → Create Credentials → API Key\n4. Copy the API key\n5. Set up a Custom Search Engine at cse.google.com',
    helpUrl: 'https://developers.google.com/custom-search/v1/overview',
  },
  {
    key: 'google_pagespeed_api_key',
    label: 'PageSpeed Insights API Key',
    storageKey: 'google_pagespeed_api_key',
    placeholder: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    category: 'SEO Tools',
    instruction:
      '1. Go to console.cloud.google.com\n2. Enable "PageSpeed Insights API"\n3. Go to Credentials → Create Credentials → API Key\n4. Copy the API key',
    helpUrl: 'https://developers.google.com/speed/docs/insights/v5/get-started',
  },
];

export const secretCategories = [...new Set(secretsConfig.map((s) => s.category))];

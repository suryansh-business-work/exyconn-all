export interface ExtractedContact {
  emails: string[];
  phones: string[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  addresses: string[];
}

export interface PageResult {
  url: string;
  contacts: ExtractedContact;
  title: string;
}

export interface ExtractionResult {
  baseUrl: string;
  pagesScanned: number;
  totalEmails: string[];
  totalPhones: string[];
  totalAddresses: string[];
  socialLinks: Record<string, string>;
  pages: PageResult[];
}

export interface ExtractFormValues {
  url: string;
  maxPages: number;
  followLinks: boolean;
}

export type ExtractionMode = 'pages' | 'contacts' | 'all';

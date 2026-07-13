export interface SocialLink {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'github' | 'website';
  url: string;
  enabled: boolean;
}

export interface SignatureFormValues {
  // Personal Info
  fullName: string;
  jobTitle: string;
  department: string;
  company: string;

  // Contact Info
  email: string;
  phone: string;
  mobile: string;
  address: string;

  // Branding
  logoUrl: string;
  logoFileId?: string;
  profilePhotoUrl: string;
  profilePhotoFileId?: string;
  bannerUrl: string;
  bannerFileId?: string;

  // Social Links
  socialLinks: SocialLink[];

  // Custom Fields
  customFields: CustomField[];

  // Rich Text
  disclaimer: string;
  ctaText: string;
  ctaUrl: string;

  // Design Options
  template: TemplateType;
  theme: ThemeType;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'link' | 'phone';
}

export type TemplateType = 'professional' | 'modern' | 'minimal' | 'creative';

export type ThemeType = 'light' | 'dark' | 'gradient' | 'corporate' | 'elegant';

export interface SignatureTheme {
  id: ThemeType;
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export const signatureThemes: SignatureTheme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean white background',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    accentColor: '#2563eb',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Professional dark mode',
    bgColor: '#1e293b',
    textColor: '#f8fafc',
    accentColor: '#60a5fa',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Subtle gradient background',
    bgColor: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    textColor: '#1e293b',
    accentColor: '#0284c7',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Formal business style',
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    accentColor: '#1e40af',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined and sophisticated',
    bgColor: '#faf5ff',
    textColor: '#3b0764',
    accentColor: '#7c3aed',
  },
];

export interface SignatureTemplate {
  id: TemplateType;
  name: string;
  description: string;
  preview: string;
}

export const defaultSocialLinks: SocialLink[] = [
  { platform: 'linkedin', url: '', enabled: false },
  { platform: 'twitter', url: '', enabled: false },
  { platform: 'facebook', url: '', enabled: false },
  { platform: 'instagram', url: '', enabled: false },
  { platform: 'github', url: '', enabled: false },
  { platform: 'website', url: '', enabled: false },
];

export const defaultFormValues: SignatureFormValues = {
  fullName: '',
  jobTitle: '',
  department: '',
  company: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  logoUrl: '',
  logoFileId: undefined,
  profilePhotoUrl: '',
  profilePhotoFileId: undefined,
  bannerUrl: '',
  bannerFileId: undefined,
  socialLinks: defaultSocialLinks,
  customFields: [],
  disclaimer: '',
  ctaText: '',
  ctaUrl: '',
  template: 'professional',
  theme: 'light',
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  fontFamily: 'Arial, sans-serif',
  fontSize: 'medium',
};

export const fontOptions = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
];

export const fontSizes = {
  small: { name: 12, title: 14, company: 11 },
  medium: { name: 14, title: 16, company: 12 },
  large: { name: 16, title: 18, company: 14 },
};

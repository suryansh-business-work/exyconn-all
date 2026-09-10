import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { BrandingForm } from './branding.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import type { BrandingRow } from './branding.types';
import { color } from '@exyconn/shell/components/ui';

const INITIAL: BrandingRow = {
  id: 'global',
  businessName: 'Exyconn',
  legalName: 'Exyconn Technologies',
  slogan: 'AI-Powered Business Solutions',
  description: '',
  logoUrl: '',
  logoDarkUrl: '',
  faviconUrl: '',
  appIconUrl: '',
  emailLogoUrl: '',
  ogImageUrl: '',
  primaryColor: color.blue[600],
  secondaryColor: color.cyan[400],
  accentColor: color.orange[600],
  backgroundColor: color.neutral[50],
  textColor: color.slate[950],
  supportEmail: 'support@exyconn.com',
  hrEmail: 'hr@exyconn.com',
  contactPhone: '',
  websiteUrl: 'https://exyconn.com',
  address: '',
  linkedinUrl: '',
  twitterUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  githubUrl: '',
  copyrightText: '',
  gstin: '',
  stateCode: '',
  addressLine: '',
  invoicePrefix: 'INV-',
  defaultTaxPercent: 18,
  bankDetails: '',
  loginPages: [
    {
      app: 'finance',
      name: 'Finance',
      tagline: 'Invoices, billing and reimbursements.',
      backgroundImageUrl: 'https://images.example.com/finance.jpg',
      accentColor: color.sky[500],
    },
  ],
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <NotificationProvider>
            <BrandingForm initial={INITIAL} />
          </NotificationProvider>
        </MemoryRouter>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BrandingForm', () => {
  it('previews the live business name and slogan', () => {
    mount();
    cy.contains('Exyconn').should('be.visible');
    cy.contains('AI-Powered Business Solutions').should('be.visible');
  });

  it('requires the business name', () => {
    mount();
    cy.get('input[name="businessName"]').clear();
    cy.contains('button', 'Save changes').click();
    cy.contains('Business name is required').should('be.visible');
  });

  it('rejects a colour that is not a 6-digit hex', () => {
    mount();
    cy.contains('button', 'Colors').click();
    cy.get('input[name="primaryColor"]').clear().type('blue');
    cy.contains('button', 'Save changes').click();
    cy.contains('Use a 6-digit hex colour, e.g. #155dfc').should('be.visible');
  });

  it('rejects an invalid support email and website URL', () => {
    mount();
    cy.contains('button', 'Contact & Social').click();
    cy.get('input[name="supportEmail"]').clear().type('not-an-email');
    cy.get('input[name="websiteUrl"]').clear().type('nope');
    cy.contains('button', 'Save changes').click();
    cy.contains('Enter a valid email address').should('be.visible');
    cy.contains('Enter a valid URL').should('be.visible');
  });

  it('edits the per-portal login page and rejects a blank portal name', () => {
    mount();
    cy.contains('button', 'Login Pages').click();
    cy.get('input[name="loginPages.0.name"]').should('have.value', 'Finance').clear();
    cy.contains('button', 'Save changes').click();
    cy.contains('Portal name is required').should('be.visible');
  });

  it('rejects a login background that is not a URL', () => {
    mount();
    cy.contains('button', 'Login Pages').click();
    cy.get('input[name="loginPages.0.backgroundImageUrl"]').clear().type('nope');
    cy.contains('button', 'Save changes').click();
    cy.contains('Enter a valid URL').should('be.visible');
  });

  it('accepts an empty optional URL', () => {
    mount();
    cy.contains('button', 'Contact & Social').click();
    cy.get('input[name="githubUrl"]').should('have.value', '');
    cy.contains('button', 'Save changes').click();
    cy.contains('Enter a valid URL').should('not.exist');
  });
});

import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { BrandingForm } from './branding.form';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';
import type { BrandingRow } from './branding.types';

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
  primaryColor: '#155dfc',
  secondaryColor: '#00d4ff',
  accentColor: '#f97316',
  backgroundColor: '#f4f6fb',
  textColor: '#0f172a',
  supportEmail: 'support@exyconn.com',
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
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BrandingForm initial={INITIAL} />
        </NotificationProvider>
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

  it('accepts an empty optional URL', () => {
    mount();
    cy.contains('button', 'Contact & Social').click();
    cy.get('input[name="githubUrl"]').should('have.value', '');
    cy.contains('button', 'Save changes').click();
    cy.contains('Enter a valid URL').should('not.exist');
  });
});

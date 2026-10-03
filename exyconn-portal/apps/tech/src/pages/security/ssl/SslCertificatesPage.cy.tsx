import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SslCertificateStatus, SslCertificatesDocument } from '@exyconn/shell/graphql/generated';
import { SslCertificatesPage } from './SslCertificatesPage';

const certificate = (
  host: string,
  status: SslCertificateStatus,
  daysLeft: number | null,
  error = '',
) => ({
  __typename: 'SslCertificate' as const,
  host,
  monitors: [`${host} monitor`],
  status,
  subject: host,
  altNames: [host, `www.${host}`],
  issuer: "Let's Encrypt (R11)",
  validFrom: daysLeft === null ? null : '2026-08-01T00:00:00.000Z',
  validTo: daysLeft === null ? null : '2026-12-01T00:00:00.000Z',
  daysLeft,
  serialNumber: '0A1B2C',
  fingerprint256: 'AA:BB:CC:DD',
  protocol: daysLeft === null ? '' : 'TLSv1.3',
  authorized: status === SslCertificateStatus.Ok || status === SslCertificateStatus.Expiring,
  error,
  checkedAt: '2026-10-04T08:00:00.000Z',
});

const report = (certificates: ReturnType<typeof certificate>[]) => ({
  sslCertificates: {
    __typename: 'SslCertificateReport' as const,
    warningDays: 30,
    checkedAt: '2026-10-04T08:00:00.000Z',
    certificates,
  },
});

const FULL = report([
  certificate('portal.exyconn.com', SslCertificateStatus.Ok, 80),
  certificate('hr.exyconn.com', SslCertificateStatus.Expiring, 12),
  certificate('old.exyconn.com', SslCertificateStatus.Expired, -3, 'CERT_HAS_EXPIRED'),
  certificate('gone.exyconn.com', SslCertificateStatus.Unreachable, null, 'ECONNREFUSED'),
]);

const mock = (variables: Record<string, unknown>, data: object): MockedResponse => ({
  request: { query: SslCertificatesDocument, variables },
  result: { data },
});

const mount = (mocks: MockedResponse[]) => {
  cy.viewport(1280, 900);
  cy.mount(
    <MemoryRouter initialEntries={['/tech/security/ssl']}>
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <Routes>
              <Route path="/tech/security/ssl" element={<SslCertificatesPage />} />
              <Route path="/tech/status-monitors" element={<p>Status monitors screen</p>} />
            </Routes>
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

/** The stat tile whose label is `label` — label and figure sit two levels apart. */
const tile = (label: string) => cy.contains(label).parent().parent();

describe('SslCertificatesPage', () => {
  it('summarises every host and flags the ones that need attention', () => {
    mount([mock({}, FULL)]);
    tile('Hosts checked').should('contain', '4');
    tile('Valid').should('contain', '1');
    tile('Expiring soon').should('contain', '1');
    tile('Expired or invalid').should('contain', '1');
    cy.contains('Expiring soon means 30 days or fewer left').should('be.visible');
    cy.contains('tr', 'hr.exyconn.com').should('contain', '12 days');
    cy.contains('tr', 'old.exyconn.com')
      .should('contain', 'Expired 3 days ago')
      .and('contain', 'CERT_HAS_EXPIRED');
    cy.contains('tr', 'gone.exyconn.com').should('contain', 'Unreachable');
    cy.contains('portal.exyconn.com monitor').should('be.visible');
  });

  it('opens a certificate with its fingerprint and names', () => {
    mount([mock({}, FULL)]);
    cy.contains('tr', 'portal.exyconn.com').click();
    cy.get('[role="dialog"]')
      .should('contain', 'AA:BB:CC:DD')
      .and('contain', 'www.portal.exyconn.com')
      .and('contain', '0A1B2C');
    cy.contains('button', 'Close').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('checks every host again on Refresh', () => {
    const renewed = report([certificate('hr.exyconn.com', SslCertificateStatus.Ok, 89)]);
    mount([mock({}, FULL), mock({ refresh: true }, renewed)]);
    cy.contains('tr', 'hr.exyconn.com').should('contain', '12 days');
    cy.contains('button', 'Refresh').click();
    cy.contains('tr', 'hr.exyconn.com').should('contain', '89 days');
    tile('Hosts checked').should('contain', '1');
  });

  it('points to Status monitors when there is no https host to check', () => {
    mount([mock({}, report([]))]);
    cy.contains('No https hosts to check').should('be.visible');
    cy.contains('button', 'Open Status monitors').click();
    cy.contains('Status monitors screen').should('be.visible');
  });

  it('says so when the report cannot be read', () => {
    mount([
      { request: { query: SslCertificatesDocument, variables: {} }, error: new Error('Forbidden') },
    ]);
    cy.contains('Forbidden').should('be.visible');
  });
});

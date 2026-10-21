import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { MaLanguage, MaUpdateMeetingDocument } from '@exyconn/shell/graphql/generated';
import { MeetingDetailsForm } from './meeting-details.form';

const MEETING = { id: 'meeting-1', title: 'Weekly sync', language: MaLanguage.English };

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <MeetingDetailsForm meeting={MEETING} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('MeetingDetailsForm', () => {
  it('requires a title and caps its length', () => {
    mount();
    cy.get('input[name="title"]').clear();
    cy.contains('button', 'Save').click();
    cy.contains('Meeting title is required').should('be.visible');
    cy.get('input[name="title"]').type('x'.repeat(301), { delay: 0 }).blur();
    cy.contains('Keep the title under 300 characters').should('be.visible');
  });

  it('reports a refused save and keeps the new title', () => {
    mount([
      {
        request: {
          query: MaUpdateMeetingDocument,
          variables: {
            id: 'meeting-1',
            input: { title: 'Launch review', language: MaLanguage.English },
          },
        },
        result: { errors: [{ message: 'Not your meeting' }] },
      },
    ]);
    cy.get('input[name="title"]').clear().type('Launch review');
    cy.contains('button', 'Save').click();
    cy.contains('Not your meeting').should('be.visible');
    cy.get('input[name="title"]').should('have.value', 'Launch review');
  });

  it('puts the title back on Cancel', () => {
    mount();
    cy.get('input[name="title"]').clear().type('Changed');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="title"]').should('have.value', 'Weekly sync');
  });
});

import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AddStatusIncidentUpdateDocument } from '@exyconn/shell/graphql/generated';
import { IncidentUpdateForm } from './incident-update.form';
import type { UpdatedIncident } from './incident-update.types';

const incident: UpdatedIncident = { id: 'i1', title: 'Logins failing', resolvedAt: null };
const BODY = 'Certificate renewed; sign-in is working again.';

const resolveMock: MockedResponse = {
  request: {
    query: AddStatusIncidentUpdateDocument,
    variables: { id: 'i1', status: 'RESOLVED', body: BODY },
  },
  result: {
    data: { addStatusIncidentUpdate: { id: 'i1', resolvedAt: '2026-09-07T10:00:00Z' } },
  },
};

const mount = (row: UpdatedIncident, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <IncidentUpdateForm
            incident={row}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const chooseStatus = (label: string) => {
  cy.get('[role="combobox"]').click();
  cy.get('li[role="option"]').contains(label).click();
};

describe('IncidentUpdateForm', () => {
  it('refuses an empty update', () => {
    mount(incident);
    cy.contains('button', 'Post').click();

    cy.contains('at least 10 characters').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('warns before resolving', () => {
    mount(incident);
    chooseStatus('Resolved');
    cy.contains('alerts Slack').should('be.visible');
  });

  it('posts the update and calls onDone', () => {
    mount(incident, [resolveMock]);
    chooseStatus('Resolved');
    cy.get('textarea[name="body"]').type(BODY);
    cy.contains('button', 'Post').click();

    cy.get('@done').should('have.been.called');
  });

  it('closes the timeline of a resolved incident', () => {
    mount({ ...incident, resolvedAt: '2026-09-07T10:00:00Z' });
    cy.contains('timeline is closed').should('be.visible');
    cy.contains('button', 'Post').should('not.exist');
  });

  it('calls onCancel', () => {
    mount(incident);
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});

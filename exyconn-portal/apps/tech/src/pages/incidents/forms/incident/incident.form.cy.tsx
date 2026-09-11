import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  CreateStatusIncidentDocument,
  ListStatusMonitorsDocument,
} from '@exyconn/shell/graphql/generated';
import { IncidentForm } from './incident.form';

const monitorsMock: MockedResponse = {
  request: { query: ListStatusMonitorsDocument },
  result: { data: { listStatusMonitors: [{ id: 'm1', key: 'hr', name: 'HR Portal' }] } },
};

const BODY = 'Sign-in requests are timing out; investigating the session store.';

const createMock: MockedResponse = {
  request: {
    query: CreateStatusIncidentDocument,
    variables: {
      input: { title: 'Logins failing', impact: 'MAJOR', affectedServiceKeys: ['hr'], body: BODY },
    },
  },
  result: { data: { createStatusIncident: { id: 'i1' } } },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={[monitorsMock, ...mocks]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <IncidentForm onDone={cy.stub().as('done')} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('IncidentForm', () => {
  it('refuses an empty incident and says what is missing', () => {
    mount();
    cy.contains('button', 'Create').click();

    cy.contains('Give the incident a title').should('be.visible');
    cy.contains('Choose at least one affected service').should('be.visible');
    cy.contains('at least 10 characters').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('opens the incident and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="title"]').type('Logins failing');
    cy.get('[name="affectedServiceKeys"]').parent().click();
    cy.contains('li', 'HR Portal').click();
    cy.get('body').type('{esc}');
    cy.get('textarea[name="body"]').type(BODY);
    cy.contains('button', 'Create').click();

    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});

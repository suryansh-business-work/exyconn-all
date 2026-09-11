import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { theme } from '@exyconn/shell/config/theme';
import {
  ListStatusMonitorsDocument,
  UpdateStatusMaintenanceDocument,
} from '@exyconn/shell/graphql/generated';
import { MaintenanceForm } from './maintenance.form';
import type { MaintenanceRow } from './maintenance.types';

const monitorsMock: MockedResponse = {
  request: { query: ListStatusMonitorsDocument },
  result: { data: { listStatusMonitors: [{ id: 'm1', key: 'api', name: 'Portal API' }] } },
};

const existing: MaintenanceRow = {
  id: 'w1',
  title: 'Database upgrade',
  body: 'Read-only for an hour.',
  affectedServiceKeys: ['api'],
  startsAt: '2026-09-10T22:00:00.000Z',
  endsAt: '2026-09-10T23:00:00.000Z',
  createdBy: 'ops@exyconn.com',
  createdAt: '2026-09-07T10:00:00.000Z',
};

const updateMock: MockedResponse = {
  request: {
    query: UpdateStatusMaintenanceDocument,
    variables: {
      id: 'w1',
      input: {
        title: 'Database upgrade (rescheduled)',
        body: existing.body,
        affectedServiceKeys: ['api'],
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
      },
    },
  },
  result: { data: { updateStatusMaintenance: { id: 'w1' } } },
};

const mount = (initial: MaintenanceRow | null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={[monitorsMock, ...mocks]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <MaintenanceForm
              initial={initial}
              onDone={cy.stub().as('done')}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('MaintenanceForm', () => {
  it('refuses an empty window and says what is missing', () => {
    mount(null);
    cy.contains('button', 'Create').click();

    cy.contains('Give the window a title').should('be.visible');
    cy.contains('Choose at least one affected service').should('be.visible');
    cy.contains('When does it start?').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('updates an existing window and calls onDone', () => {
    mount(existing, [updateMock]);
    cy.get('input[name="title"]').clear().type('Database upgrade (rescheduled)');
    cy.contains('button', 'Update').click();

    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount(null);
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});

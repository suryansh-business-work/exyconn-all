import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import {
  AppLogLevel,
  AppLogSource,
  AppLogStatus,
  ListAppLogEventsDocument,
} from '@exyconn/shell/graphql/generated';
import { LogDetailDialog } from '.';
import type { AppLogRow } from '../logs-grid';
import type { LogActions } from '../useLogActions';

const row: AppLogRow = {
  __typename: 'AppLogGroup',
  id: 'g1',
  source: AppLogSource.Mobile,
  app: 'tracker-mobile',
  level: AppLogLevel.Error,
  errorName: 'TypeError',
  message: 'undefined is not a function',
  stack: 'TypeError: undefined is not a function',
  route: '/settings',
  status: AppLogStatus.Open,
  count: 12,
  userCount: 3,
  lastUserName: 'Asha Rao',
  lastUserEmail: 'asha@exyconn.com',
  platform: 'android',
  appVersion: '1.9.10',
  firstSeenAt: '2026-09-10T08:00:00.000Z',
  lastSeenAt: '2026-09-11T10:00:00.000Z',
  resolvedAt: null,
};

const event = {
  __typename: 'AppLogEvent',
  id: 'e1',
  level: AppLogLevel.Error,
  message: 'undefined is not a function',
  stack: 'TypeError: undefined is not a function\n    at timezoneNames (index.android.bundle:1:9)',
  componentStack: '\n    in TimezonePicker\n    in SettingsScreen',
  route: '/settings',
  context: '{"fatal":false}',
  breadcrumbs: [
    {
      __typename: 'AppLogBreadcrumb',
      at: '2026-09-11T09:59:58.000Z',
      level: AppLogLevel.Debug,
      message: 'Opened /settings',
    },
  ],
  count: 1,
  occurredAt: '2026-09-11T10:00:00.000Z',
  createdAt: '2026-09-11T10:00:01.000Z',
  userId: 'u1',
  userName: 'Asha Rao',
  userEmail: 'asha@exyconn.com',
  userVerified: true,
  deviceId: 'install-1',
  platform: 'android',
  osVersion: '14',
  deviceModel: 'Pixel 7',
  appVersion: '1.9.10',
  sessionId: 's1',
  userAgent: 'okhttp/4.12',
  ip: '10.0.0.9',
};

const mocks = [
  {
    request: { query: ListAppLogEventsDocument, variables: { groupId: 'g1' } },
    result: { data: { listAppLogEvents: [event] } },
  },
];

function mount(actions: Partial<LogActions> = {}) {
  const stubs: LogActions = {
    copying: false,
    copyFixPrompt: cy.stub().as('copy').resolves(),
    copyOpenErrors: cy.stub().resolves(),
    changeStatus: cy.stub().as('status').resolves(true),
    remove: cy.stub().as('remove').resolves(false),
    ...actions,
  };
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <LogDetailDialog row={row} actions={stubs} onClose={cy.stub().as('close')} />
      </ThemeProvider>
    </MockedProvider>,
  );
}

describe('LogDetailDialog', () => {
  it('shows who hit it, on what, and what led up to it', () => {
    mount();
    cy.contains('TypeError: undefined is not a function').should('be.visible');
    cy.contains('Asha Rao').should('be.visible');
    cy.contains('android 14 Pixel 7').should('be.visible');
    cy.contains('at timezoneNames').should('be.visible');
    cy.contains('in TimezonePicker').should('be.visible');
    cy.contains('Opened /settings').should('be.visible');
  });

  it('copies the fix prompt for Claude', () => {
    mount();
    cy.contains('button', 'Copy fix prompt for Claude').click();
    cy.get('@copy').should('have.been.calledWith', row);
  });

  it('closes after resolving, but stays open when a delete is cancelled', () => {
    mount();
    cy.contains('button', 'Delete').click();
    cy.get('@remove').should('have.been.called');
    cy.get('@close').should('not.have.been.called');
    cy.contains('button', 'Mark resolved').click();
    cy.get('@status').should('have.been.calledWith', row, AppLogStatus.Resolved);
    cy.get('@close').should('have.been.called');
  });
});

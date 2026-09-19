import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  ListPermissionModulesDocument,
  ListRolePermissionsDocument,
  PermissionAction as A,
  Role,
} from '@exyconn/shell/graphql/generated';
import { PermissionMatrix } from './PermissionMatrix';

const MOCKS = [
  {
    request: { query: ListPermissionModulesDocument },
    result: { data: { listPermissionModules: ['Activity', 'Budget', 'Invoice'] } },
    maxUsageCount: 5,
  },
  {
    request: { query: ListRolePermissionsDocument },
    result: {
      data: {
        listRolePermissions: [
          {
            __typename: 'RolePermission',
            id: '1',
            role: 'HR',
            module: 'Budget',
            actions: [A.View],
            updatedAt: '2026-09-19T00:00:00.000Z',
          },
        ],
      },
    },
    maxUsageCount: 5,
  },
];

const mount = () =>
  cy.mount(
    <MockedProvider mocks={MOCKS}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PermissionMatrix role={Role.Hr} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PermissionMatrix (browser)', () => {
  it('lays the matrix out as a table with actions as column headings', () => {
    mount();
    cy.get('table').within(() => {
      cy.get('th[scope="col"]').should('have.length', 9);
      cy.get('th[scope="row"]').should('have.length', 3);
    });
  });

  it('uses native, focusable checkboxes, and shows the save bar on a change', () => {
    mount();
    cy.get('input[aria-label="Edit in Activity"]').should('have.attr', 'type', 'checkbox').focus();
    cy.focused().should('have.attr', 'aria-label', 'Edit in Activity');
    cy.focused().click();
    cy.contains('button', 'Save changes').should('be.visible');
    cy.contains('1 module(s) changed').should('be.visible');
  });
});

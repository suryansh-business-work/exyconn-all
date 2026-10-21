import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { AssignLegalItemsDocument, LegalItemKind } from '@/graphql/generated';
import { AssignLegalForm } from './assign-legal.form';
import type { LegalAssignableRow } from './assign-legal.types';

const row = (
  id: string,
  kind: LegalItemKind,
  title: string,
  group: { id: string; name: string } | null,
): LegalAssignableRow => ({
  __typename: 'LegalAssignable',
  id,
  kind,
  title,
  status: 'ACTIVE',
  groupId: group?.id ?? null,
  groupName: group?.name ?? null,
});

const PART_TIME = { id: 'g1', name: 'Part Time Employee Contracts' };
const OPTIONS = [
  row('c1', LegalItemKind.Contract, 'Part-time offer', PART_TIME),
  row('c2', LegalItemKind.Contract, 'Part-time NDA', PART_TIME),
  row('p1', LegalItemKind.Policy, 'Code of conduct', null),
];

const assigned = {
  request: {
    query: AssignLegalItemsDocument,
    variables: (vars: { userId: string; items: { kind: string; itemId: string }[] }) =>
      vars.userId === 'e1' && vars.items.length === 2,
  },
  result: { data: { assignLegalItems: [] } },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[assigned]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AssignLegalForm
            employeeId="e1"
            options={OPTIONS}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AssignLegalForm', () => {
  it('asks for at least one item', () => {
    mount();
    cy.contains('button', 'Assign').click();
    cy.contains('Choose at least one contract, policy or document').should('be.visible');
  });

  it('lists items under their register and group', () => {
    mount();
    cy.get('input[name="items"]').click();
    cy.contains('Contracts · Part Time Employee Contracts').should('be.visible');
    cy.contains('li', 'Code of conduct').should('be.visible');
  });

  it('adds a whole group and assigns it', () => {
    mount();
    // The group shortcut is the first picker on the form.
    cy.get('[role="combobox"]').first().click();
    cy.contains('li', 'Part Time Employee Contracts (2 items)').click();
    cy.contains('Part-time offer').should('be.visible');
    cy.contains('Part-time NDA').should('be.visible');
    cy.contains('button', 'Assign').click();
    cy.get('@done').should('have.been.calledOnce');
  });

  it('cancels', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});

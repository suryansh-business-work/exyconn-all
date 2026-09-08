import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SlaPolicyForm } from './sla-policy.form';
import type { SlaPolicyRow } from './sla-policy.types';

const policy: SlaPolicyRow = {
  id: 'p1',
  priority: 'HIGH',
  firstResponseMinutes: 60,
  resolutionMinutes: 480,
  active: true,
} as SlaPolicyRow;

const mount = (initial: SlaPolicyRow | null) =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SlaPolicyForm initial={initial} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SlaPolicyForm', () => {
  it('refuses a first response promised after the resolution', () => {
    mount(policy);
    cy.get('input[name="firstResponseMinutes"]').clear().type('600');
    cy.contains('button', 'Save').click();
    cy.contains('A first response cannot be promised later than the resolution').should(
      'be.visible',
    );
  });

  it('refuses a window of no minutes', () => {
    mount(null);
    cy.get('input[name="resolutionMinutes"]').clear().type('0');
    cy.contains('button', 'Save').click();
    cy.contains('Resolution must be at least 1 minute').should('be.visible');
  });

  it('calls onCancel', () => {
    mount(policy);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});

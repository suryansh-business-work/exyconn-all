import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { theme } from '@exyconn/shell/config/theme';
import { OffComputerTimeForm } from './off-computer-time.form';

const projects = [
  { id: 'global', name: 'Global Project' },
  { id: 'acme', name: 'Acme rollout' },
];

const mount = (onDone = cy.stub()) =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <OffComputerTimeForm projects={projects} onDone={onDone} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** The picker's text input, reached through its label (MUI owns the generated id). */
const field = (label: string) => cy.contains('label', label).parent().find('input').first();

describe('OffComputerTimeForm', () => {
  it('books against the house-wide project until another is picked', () => {
    mount();
    cy.contains('Global Project').should('exist');
  });

  it('will not send a claim with no explanation', () => {
    mount();
    cy.contains('button', 'Send for approval').click();
    cy.contains('Say what the time was for').should('exist');
  });

  it('will not send a claim with no start time', () => {
    mount();
    cy.get('textarea[name="note"]').type('Client kickoff');
    cy.contains('button', 'Send for approval').click();
    cy.contains('When did the work start?').should('exist');
  });

  it('rejects a window that ends before it starts', () => {
    mount();
    field('Started').type('09/03/2026 05:00 PM');
    field('Ended').type('09/03/2026 09:00 AM');
    cy.get('textarea[name="note"]').type('Client kickoff');
    cy.contains('button', 'Send for approval').click();
    cy.contains('The entry must end after it starts').should('exist');
  });

  it('rejects a single entry longer than a working day', () => {
    mount();
    field('Started').type('09/01/2026 01:00 AM');
    field('Ended').type('09/01/2026 11:00 PM');
    cy.get('textarea[name="note"]').type('Very long day');
    cy.contains('button', 'Send for approval').click();
    cy.contains('cannot cover more than 16 hours').should('exist');
  });
});

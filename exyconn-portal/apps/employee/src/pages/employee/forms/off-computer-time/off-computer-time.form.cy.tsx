import { MockedProvider } from '@apollo/client/testing/react';
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
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <OffComputerTimeForm projects={projects} onDone={onDone} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** The picker, reached by the name the form gives it — MUI owns everything else. */
const field = (name: string) => cy.get(`input[name="${name}"]`);

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
    field('startedAt').typeDate('090320260500PM');
    field('endedAt').typeDate('090320260900AM');
    cy.get('textarea[name="note"]').type('Client kickoff');
    cy.contains('button', 'Send for approval').click();
    cy.contains('The entry must end after it starts').should('exist');
  });

  it('rejects a single entry longer than a working day', () => {
    mount();
    field('startedAt').typeDate('090120260100AM');
    field('endedAt').typeDate('090120261100PM');
    cy.get('textarea[name="note"]').type('Very long day');
    cy.contains('button', 'Send for approval').click();
    cy.contains('cannot cover more than 16 hours').should('exist');
  });
});

import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/shell/components/ui';
import { theme } from '@exyconn/shell/config/theme';
import { EmailThreadFiltersForm } from './email-thread-filters.form';
import { EMPTY_EMAIL_FILTERS, type EmailThreadFilters } from './email-thread-filters.types';

const MAILBOXES = [
  { accountId: 'acc-1', mailbox: 'sales@exyconn.test' },
  { accountId: 'acc-2', mailbox: 'hr@exyconn.test' },
];

const mount = (filters: EmailThreadFilters = EMPTY_EMAIL_FILTERS) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <EmailThreadFiltersForm
          filters={filters}
          mailboxes={MAILBOXES}
          onApply={cy.stub().as('apply')}
          onCancel={cy.stub().as('cancel')}
        />
      </LocalizationProvider>
    </ThemeProvider>,
  );

const choose = (label: RegExp, option: string) => {
  cy.findByRole('combobox', { name: label }).click();
  cy.findByRole('option', { name: option }).click();
};

describe('EmailThreadFiltersForm', () => {
  it('applies a recent-mail preset, a direction and a mailbox', () => {
    mount();
    choose(/^Date/, 'Last 7 days');
    choose(/^Direction/, 'Received');
    choose(/^Mailbox/, 'hr@exyconn.test');
    cy.findByRole('button', { name: 'Apply filters' }).click();

    cy.get('@apply').should('have.been.calledWithMatch', {
      period: 'LAST_7_DAYS',
      direction: 'IN',
      accountId: 'acc-2',
    });
  });

  it('asks for a date when the custom range is left empty, and shows the pickers', () => {
    mount();
    choose(/^Date/, 'Custom dates');
    cy.get('input[name="after"]').should('exist');
    cy.get('input[name="before"]').should('exist');
    cy.findByRole('button', { name: 'Apply filters' }).click();

    cy.contains('Pick a start or an end date').should('be.visible');
    cy.get('@apply').should('not.have.been.called');
  });

  it('refuses an end date before the start', () => {
    mount({
      ...EMPTY_EMAIL_FILTERS,
      period: 'CUSTOM',
      after: '2026-10-10T00:00:00.000Z',
      before: '2026-10-01T00:00:00.000Z',
    });
    cy.findByRole('button', { name: 'Apply filters' }).click();

    cy.contains('Pick an end on or after the start').should('be.visible');
    cy.get('@apply').should('not.have.been.called');
  });

  it('clears every filter back to any time, either direction and every mailbox', () => {
    mount({ ...EMPTY_EMAIL_FILTERS, period: 'LAST_30_DAYS', direction: 'OUT', accountId: 'acc-1' });
    cy.findByRole('button', { name: 'Clear filters' }).click();
    cy.findByRole('button', { name: 'Apply filters' }).click();

    cy.get('@apply').should('have.been.calledWithMatch', EMPTY_EMAIL_FILTERS);
  });

  it('cancels without applying', () => {
    mount();
    cy.findByRole('button', { name: 'Cancel' }).click();

    cy.get('@cancel').should('have.been.calledOnce');
    cy.get('@apply').should('not.have.been.called');
  });
});

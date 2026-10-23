import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/shell/components/ui';
import { theme } from '@exyconn/shell/config/theme';
import { MailFiltersForm } from './mail-filters.form';
import { EMPTY_MAIL_FILTERS, type MailFilters } from './mail-filters.types';

const mount = (filters: MailFilters = EMPTY_MAIL_FILTERS) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MailFiltersForm
          filters={filters}
          onApply={cy.stub().as('apply')}
          onCancel={cy.stub().as('cancel')}
        />
      </LocalizationProvider>
    </ThemeProvider>,
  );

describe('MailFiltersForm', () => {
  it('applies a recent-mail preset with unread and attachments only', () => {
    mount();
    cy.findByRole('combobox', { name: /^Date/ }).click();
    cy.findByRole('option', { name: 'Last 30 days' }).click();
    cy.findByRole('switch', { name: 'Unread only' }).click();
    cy.findByRole('switch', { name: 'With attachments only' }).click();
    cy.findByRole('button', { name: 'Apply filters' }).click();

    cy.get('@apply').should('have.been.calledWithMatch', {
      period: 'LAST_30_DAYS',
      unreadOnly: true,
      withAttachments: true,
    });
  });

  it('asks for a date when the custom range is left empty', () => {
    mount();
    cy.findByRole('combobox', { name: /^Date/ }).click();
    cy.findByRole('option', { name: 'Custom dates' }).click();
    cy.findByRole('button', { name: 'Apply filters' }).click();

    cy.contains('Pick a start or an end date').should('be.visible');
    cy.get('@apply').should('not.have.been.called');
  });

  it('clears every filter, and cancels without applying', () => {
    mount({ ...EMPTY_MAIL_FILTERS, period: 'LAST_7_DAYS', unreadOnly: true });
    cy.findByRole('button', { name: 'Clear filters' }).click();
    cy.findByRole('button', { name: 'Apply filters' }).click();
    cy.get('@apply').should('have.been.calledWithMatch', EMPTY_MAIL_FILTERS);

    cy.findByRole('button', { name: 'Cancel' }).click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});

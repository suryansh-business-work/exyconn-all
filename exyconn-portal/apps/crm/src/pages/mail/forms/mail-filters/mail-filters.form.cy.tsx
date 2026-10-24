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

/** Opens the select for the field `name` and picks `option`. */
const choose = (name: string, option: string) => {
  cy.get(`input[name="${name}"]`).parent().find('[role="combobox"]').click();
  cy.contains('li[role="option"]', option).click();
};

describe('MailFiltersForm', () => {
  it('applies a recent-mail preset with unread and attachments only', () => {
    mount();
    choose('period', 'Last 30 days');
    cy.contains('label', 'Unread only').click();
    cy.contains('label', 'With attachments only').click();
    cy.contains('button', 'Apply filters').click();

    cy.get('@apply').should('have.been.calledWithMatch', {
      period: 'LAST_30_DAYS',
      unreadOnly: true,
      withAttachments: true,
    });
  });

  it('asks for a date when the custom range is left empty', () => {
    mount();
    choose('period', 'Custom dates');
    cy.contains('button', 'Apply filters').click();

    cy.contains('Pick a start or an end date').should('be.visible');
    cy.get('@apply').should('not.have.been.called');
  });

  it('clears every filter, and cancels without applying', () => {
    mount({ ...EMPTY_MAIL_FILTERS, period: 'LAST_7_DAYS', unreadOnly: true });
    cy.contains('button', 'Clear filters').click();
    cy.contains('button', 'Apply filters').click();
    cy.get('@apply').should('have.been.calledWithMatch', EMPTY_MAIL_FILTERS);

    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});

import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { PayslipScheduleForm } from './payslip-schedule.form';
import type { PayslipScheduleRow } from './payslip-schedule.types';

const schedule: PayslipScheduleRow = {
  enabled: false,
  dayOfMonth: 1,
  hour: 10,
  minute: 0,
  period: 'PREVIOUS_MONTH',
  lastRunAt: null,
  lastRunPeriod: '',
  lastSent: 0,
  lastFailed: 0,
  lastSkipped: 0,
};

const mount = (initial: PayslipScheduleRow = schedule) =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PayslipScheduleForm
            initial={initial}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PayslipScheduleForm', () => {
  it('shows the stored schedule', () => {
    mount({ ...schedule, enabled: true, dayOfMonth: 5, hour: 9, minute: 30 });
    cy.get('input[name="enabled"]').should('be.checked');
    cy.contains('Day 5').should('be.visible');
    cy.contains('09:00').should('be.visible');
    cy.contains(':30').should('be.visible');
  });

  it('offers only days that exist in every month', () => {
    mount();
    cy.contains('label', 'Day of the month').parent().find('[role="combobox"]').click();
    cy.contains('[role="option"]', 'Day 28').should('exist');
    cy.contains('[role="option"]', 'Day 29').should('not.exist');
  });

  it('lets HR choose which month is sent', () => {
    mount();
    cy.contains('label', 'Send payslips for').parent().find('[role="combobox"]').click();
    cy.contains('[role="option"]', 'The current month').click();
    cy.contains('The current month').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});

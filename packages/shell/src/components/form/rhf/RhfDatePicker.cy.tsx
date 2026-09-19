import { FormProvider, useForm } from 'react-hook-form';
import { LocalizationProvider, AdapterDateFns } from '@/components/ui';
import { ThemeProvider } from '@/components/ui/styles';
import { theme } from '@/config/theme';
import { RhfDatePicker } from './RhfDatePicker';

/** The 15th of this month: days 1-14 fall before it, 16 onwards after. */
const now = new Date();
const MIN = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

function Harness() {
  const methods = useForm({ defaultValues: { toDate: '' } });
  return (
    <FormProvider {...methods}>
      <RhfDatePicker
        name="toDate"
        label="To date"
        minDate={MIN}
        helperText="On or after the from date."
      />
    </FormProvider>
  );
}

describe('RhfDatePicker', () => {
  beforeEach(() => {
    cy.mount(
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Harness />
        </LocalizationProvider>
      </ThemeProvider>,
    );
  });

  it('shows its hint under the field', () => {
    cy.contains('On or after the from date.').should('be.visible');
  });

  it('disables every day before the minimum date', () => {
    cy.get('button[aria-label^="Choose date"]').click();
    cy.get('[role="dialog"], .MuiPickersPopper-root').within(() => {
      cy.contains('button[role="gridcell"]', /^14$/).should('be.disabled');
      cy.contains('button[role="gridcell"]', /^16$/).should('not.be.disabled');
    });
  });
});

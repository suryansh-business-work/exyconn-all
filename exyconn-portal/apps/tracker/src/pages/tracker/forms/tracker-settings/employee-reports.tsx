import { useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Box, FormHelperText, Grid } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTimePicker } from '@exyconn/shell/components/form/rhf';

/**
 * Each employee's own hours by email: their day every evening, their week on Sunday and their
 * month on its last day — the week and month with the PDF report attached. Sent at this hour
 * in each employee's own timezone.
 */
export function EmployeeReportFields() {
  const t = useT();
  const { watch } = useFormContext<{
    employeeDailyReportEnabled: boolean;
    employeeWeeklyReportEnabled: boolean;
    employeeMonthlyReportEnabled: boolean;
  }>();
  const anyOn =
    watch('employeeDailyReportEnabled') ||
    watch('employeeWeeklyReportEnabled') ||
    watch('employeeMonthlyReportEnabled');

  return (
    <Box>
      <RhfSwitch name="employeeDailyReportEnabled" label="Email each employee their day" />
      <RhfSwitch
        name="employeeWeeklyReportEnabled"
        label="Email each employee their week (Sundays, with PDF)"
      />
      <RhfSwitch
        name="employeeMonthlyReportEnabled"
        label="Email each employee their month (last day, with PDF)"
      />
      <FormHelperText>
        {t(
          'Sent to every employee with tracker access: expected, logged, active, off-computer and idle time, the deficit and earnings.',
        )}
      </FormHelperText>
      {anyOn ? (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RhfTimePicker
              name="employeeReportHour"
              label="Send at"
              hoursOnly
              helperText="Read in each employee's own timezone, e.g. 8 pm."
            />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}

import { describe, expect, it } from 'vitest';
import { PortalPickers } from '@/app/PortalPickers';
import { RhfDatePicker, RhfDateTimePicker } from '@/components/form/rhf';
import { renderWithProviders } from '../test-utils';
import { FormHarness } from '../components/form/formHarness';

const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
const localIso = (...parts: [number, number, number, number, number]) =>
  new Date(...parts).toISOString();

describe('PortalPickers', () => {
  it("writes every date picker in the reader's own pattern", () => {
    renderWithProviders(
      <PortalPickers>
        <FormHarness defaultValues={{ day: localIso(2026, 2, 4, 0, 0) }}>
          <RhfDatePicker name="day" label="Day" />
        </FormHarness>
      </PortalPickers>,
      { settings: { dateFormat: 'yyyy-MM-dd' } },
    );

    expect(input('day')).toHaveValue('2026-03-04');
  });

  it('writes a 24-hour reader a date and time without am/pm', () => {
    renderWithProviders(
      <PortalPickers>
        <FormHarness defaultValues={{ at: localIso(2026, 2, 4, 15, 30) }}>
          <RhfDateTimePicker name="at" label="At" />
        </FormHarness>
      </PortalPickers>,
      { settings: { dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' } },
    );

    expect(input('at')).toHaveValue('04/03/2026 15:30');
  });

  it('writes a 12-hour reader a date and time with am/pm', () => {
    renderWithProviders(
      <PortalPickers>
        <FormHarness defaultValues={{ at: localIso(2026, 2, 4, 15, 30) }}>
          <RhfDateTimePicker name="at" label="At" />
        </FormHarness>
      </PortalPickers>,
      { settings: { dateFormat: 'dd MMM yyyy', timeFormat: 'hh:mm a' } },
    );

    expect(input('at')).toHaveValue('04 Mar 2026 03:30 PM');
  });
});

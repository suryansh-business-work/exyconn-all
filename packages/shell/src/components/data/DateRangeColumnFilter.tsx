import { useCallback } from 'react';
import { useGridFilter, type CustomFilterProps } from 'ag-grid-react';
import { format, isValid, parseISO } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Box, Button, DatePicker, Stack } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import type { DateRangeFilterModel } from './serverGridQuery';

const DAY = 'yyyy-MM-dd';
/**
 * ag-grid closes a filter popup on any click outside it; a picker's calendar opens in a popper
 * on the body, so it carries the class ag-grid treats as part of the filter.
 */
const INSIDE_FILTER = { popper: { className: 'ag-custom-component-popup' } };

type End = 'from' | 'to';

/** A model with one end changed; null once neither end is set. */
export function withEnd(
  model: DateRangeFilterModel | null,
  end: End,
  date: Date | null,
): DateRangeFilterModel | null {
  const day = date && isValid(date) ? format(date, DAY) : null;
  const next = { from: model?.from ?? null, to: model?.to ?? null, [end]: day };
  return next.from || next.to ? { filterType: 'dateRange', ...next } : null;
}

/** A stored day back as the Date a picker shows. */
function pickerValue(day: string | null | undefined): Date | null {
  return day ? parseISO(day) : null;
}

/**
 * The filter of a date column: a From and a To day (either may be left open), picked with
 * MUI X date pickers. The days are read in the admin-configured timezone when the grid sends
 * them (serverGridQuery's toFilters).
 */
export function DateRangeColumnFilter({
  model,
  onModelChange,
}: Readonly<CustomFilterProps<unknown, unknown, DateRangeFilterModel>>) {
  const t = useT();
  const { dateFormat } = useSettings().settings;
  const getModelAsString = useCallback(
    (current: DateRangeFilterModel | null) => {
      // A stored day is a calendar day, not an instant, so it is shown as-is in the
      // admin-configured pattern rather than moved through a timezone.
      const shown = (day: string | null | undefined) =>
        day ? format(parseISO(day), dateFormat) : '…';
      return t('{from} to {to}', { from: shown(current?.from), to: shown(current?.to) });
    },
    [dateFormat, t],
  );
  // The server filters every page, so a row the grid already has always passes.
  useGridFilter({ doesFilterPass: () => true, getModelAsString });
  return (
    <Box sx={{ p: 2, width: 260 }}>
      <Stack spacing={2}>
        <DatePicker
          label={t('From')}
          value={pickerValue(model?.from)}
          maxDate={pickerValue(model?.to) ?? undefined}
          onChange={(date) => onModelChange(withEnd(model, 'from', date))}
          slotProps={{ ...INSIDE_FILTER, textField: { size: 'small' } }}
        />
        <DatePicker
          label={t('To')}
          value={pickerValue(model?.to)}
          minDate={pickerValue(model?.from) ?? undefined}
          onChange={(date) => onModelChange(withEnd(model, 'to', date))}
          slotProps={{ ...INSIDE_FILTER, textField: { size: 'small' } }}
        />
        <Button size="small" onClick={() => onModelChange(null)} disabled={!model}>
          {t('Clear')}
        </Button>
      </Stack>
    </Box>
  );
}

import { useMemo, type ReactNode } from 'react';
import { useI18n } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';

/**
 * MUI X pickers, typed and shown in the reader's own date pattern (their profile, else
 * Admin › Settings). Set once here so every picker in every portal follows it — the
 * form-bound ones and the bare ones in filters alike — and changes the moment it is saved.
 */
export function PortalPickers({ children }: Readonly<{ children: ReactNode }>) {
  const { dateFormat } = useI18n().settings;
  const dateFormats = useMemo(
    () => ({
      keyboardDate: dateFormat,
      keyboardDateTime12h: `${dateFormat} hh:mm aa`,
      keyboardDateTime24h: `${dateFormat} HH:mm`,
    }),
    [dateFormat],
  );
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} dateFormats={dateFormats}>
      {children}
    </LocalizationProvider>
  );
}

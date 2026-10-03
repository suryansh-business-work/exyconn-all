import type { ReactElement } from 'react';
import { CircularProgress } from '@exyconn/ui';

/**
 * Stands in for a select's arrow while its list loads or its choice is being saved — passed as
 * `slotProps.select.IconComponent`, so it sits exactly where the arrow was. Hidden from screen
 * readers: the field's helper text says the same thing in words.
 */
export default function SelectSpinner({
  className,
}: Readonly<{ className?: string }>): ReactElement {
  return <CircularProgress size={16} color="inherit" className={className} aria-hidden />;
}

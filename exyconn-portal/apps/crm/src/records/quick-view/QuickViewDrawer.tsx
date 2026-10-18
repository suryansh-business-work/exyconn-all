import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Drawer } from '@exyconn/shell/components/ui';

interface QuickViewDrawerProps {
  open: boolean;
  onClose: () => void;
  /** The panel's accessible name, e.g. "Company preview". */
  label: string;
  children: ReactNode;
}

/**
 * A list's side panel for one record. Focus moves into it on open and back to the row on close;
 * Escape and a click outside close it.
 */
export function QuickViewDrawer({
  open,
  onClose,
  label,
  children,
}: Readonly<QuickViewDrawerProps>) {
  const t = useT();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-label': t(label),
          sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100%' },
        },
      }}
    >
      {children}
    </Drawer>
  );
}

import type { ReactNode } from 'react';
import { Stack } from '@exyconn/shell/components/ui';
import { QuickViewStatus } from './QuickViewStatus';
import { QuickViewToolbar } from './QuickViewToolbar';

interface QuickViewPanelProps {
  /** The record's own page. */
  fullViewTo: string;
  onClose: () => void;
  /** The record's Edit control, once it has loaded. */
  edit?: ReactNode;
  /** The query's error, if reading the record failed. */
  error?: unknown;
  onRetry: () => void;
  loadingLabel: string;
  errorText: string;
  /** The record's summary; absent while it loads or when it failed. */
  children?: ReactNode;
}

/** The inside of a quick view: the top row, then the summary — or its skeleton or error. */
export function QuickViewPanel({
  fullViewTo,
  onClose,
  edit,
  error,
  onRetry,
  loadingLabel,
  errorText,
  children,
}: Readonly<QuickViewPanelProps>) {
  return (
    <>
      <QuickViewToolbar fullViewTo={fullViewTo} edit={edit} onClose={onClose} />
      <Stack spacing={2} sx={{ p: 2 }}>
        {children ?? (
          <QuickViewStatus
            error={error}
            onRetry={onRetry}
            loadingLabel={loadingLabel}
            errorText={errorText}
          />
        )}
      </Stack>
    </>
  );
}

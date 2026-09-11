import { Alert, Box, TextField } from '@/components/ui';
import { TableRefreshButton } from './TableRefreshButton';

interface ServerGridToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  onRefresh: () => void;
  loading: boolean;
  /** The last page request's failure, shown until a later request succeeds. */
  loadError: string | null;
}

/** The search box, refresh button and load-failure notice above a {@link ServerDataGrid}. */
export function ServerGridToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  onRefresh,
  loading,
  loadError,
}: Readonly<ServerGridToolbarProps>) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          slotProps={{ htmlInput: { 'aria-label': searchPlaceholder } }}
          sx={{ width: { xs: '100%', sm: 320 } }}
        />
        <TableRefreshButton onRefresh={onRefresh} disabled={loading} />
      </Box>
      {loadError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {`Could not load the rows (${loadError}). Use Refresh to try again.`}
        </Alert>
      )}
    </>
  );
}

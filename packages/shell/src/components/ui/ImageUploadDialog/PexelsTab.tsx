import { useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@exyconn/ui';
import SearchIcon from '@mui/icons-material/Search';
import {
  useSearchPexelsPhotosQuery,
  useSearchPexelsVideosQuery,
  type PexelsMediaFieldsFragment,
} from '@/graphql/generated';
import { PexelsGrid } from './PexelsGrid';
import { PexelsFilters } from './PexelsFilters';
import { EMPTY_FILTERS, toApiFilters, type PexelsFilterState } from './pexels-filters';

/** Which half of the Pexels library a tab searches. */
export type PexelsKind = 'photos' | 'videos';

interface PexelsTabProps {
  kind: PexelsKind;
  onPick: (item: PexelsMediaFieldsFragment) => void;
}

/**
 * Stock photo / stock video tab. The search runs on submit rather than on every keystroke
 * so a Pexels quota is not spent typing — and it is deliberately not a `<form>`: the dialog
 * renders inside the host's form, and a submit event would bubble up the React tree and
 * save (and close) that form. Enter is handled here and stopped here.
 */
export function PexelsTab({ kind, onPick }: Readonly<PexelsTabProps>) {
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [filters, setFilters] = useState<PexelsFilterState>(EMPTY_FILTERS);
  const isPhotos = kind === 'photos';
  const variables = { query: submitted, filters: toApiFilters(kind, filters) };

  const photos = useSearchPexelsPhotosQuery({ variables, skip: !submitted || !isPhotos });
  const videos = useSearchPexelsVideosQuery({ variables, skip: !submitted || isPhotos });

  const active = isPhotos ? photos : videos;
  const items = isPhotos
    ? (photos.data?.searchPexelsPhotos ?? [])
    : (videos.data?.searchPexelsVideos ?? []);

  const noun = isPhotos ? 'photos' : 'videos';
  const creditLine = isPhotos ? 'Photos provided by Pexels.' : 'Videos provided by Pexels.';

  const search = () => setSubmitted(term.trim());

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    search();
  };

  return (
    <Stack spacing={1.5}>
      <TextField
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Search Pexels ${noun}`}
        inputProps={{ 'aria-label': `Search Pexels ${noun}` }}
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                size="small"
                onClick={search}
                aria-label={`search pexels ${noun}`}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <PexelsFilters kind={kind} value={filters} onChange={setFilters} />

      <Box sx={{ minHeight: 240, maxHeight: 320, overflowY: 'auto' }}>
        <PexelsPanel
          loading={active.loading}
          error={active.error?.message ?? null}
          items={items}
          submitted={Boolean(submitted)}
          noun={noun}
          onPick={onPick}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        {creditLine}
      </Typography>
    </Stack>
  );
}

interface PexelsPanelProps {
  loading: boolean;
  error: string | null;
  items: readonly PexelsMediaFieldsFragment[];
  submitted: boolean;
  noun: string;
  onPick: (item: PexelsMediaFieldsFragment) => void;
}

/** The one thing the results area is showing right now: spinner, error, empty or grid. */
function PexelsPanel({
  loading,
  error,
  items,
  submitted,
  noun,
  onPick,
}: Readonly<PexelsPanelProps>) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }
  if (!submitted) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        Search to browse free stock {noun}.
      </Typography>
    );
  }
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        No {noun} matched that search.
      </Typography>
    );
  }
  return <PexelsGrid items={items} onPick={onPick} />;
}

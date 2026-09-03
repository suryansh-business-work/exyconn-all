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

/** Which half of the Pexels library a tab searches. */
export type PexelsKind = 'photos' | 'videos';

interface PexelsTabProps {
  kind: PexelsKind;
  onPick: (item: PexelsMediaFieldsFragment) => void;
}

/**
 * Stock photo / stock video tab. The search runs on submit rather than on every
 * keystroke so a Pexels quota is not spent typing, and the API key it goes through is
 * the active one in Tech > Environment Variables > Pexels.
 */
export function PexelsTab({ kind, onPick }: Readonly<PexelsTabProps>) {
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');
  const isPhotos = kind === 'photos';

  const photos = useSearchPexelsPhotosQuery({
    variables: { query: submitted },
    skip: !submitted || !isPhotos,
  });
  const videos = useSearchPexelsVideosQuery({
    variables: { query: submitted },
    skip: !submitted || isPhotos,
  });

  const active = isPhotos ? photos : videos;
  const items = isPhotos
    ? (photos.data?.searchPexelsPhotos ?? [])
    : (videos.data?.searchPexelsVideos ?? []);

  const noun = isPhotos ? 'photos' : 'videos';
  const creditLine = isPhotos ? 'Photos provided by Pexels.' : 'Videos provided by Pexels.';

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(term.trim());
  };

  return (
    <Stack spacing={1.5}>
      <form onSubmit={search}>
        <TextField
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={`Search Pexels ${noun}`}
          inputProps={{ 'aria-label': `Search Pexels ${noun}` }}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" size="small" aria-label={`search pexels ${noun}`}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </form>

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

import React from 'react';
import { Box, Step, StepLabel, StepContent, Button, Typography, Slider, CircularProgress } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { SearchStepProps } from './types';

const SearchStep: React.FC<SearchStepProps> = ({
  maxResults,
  onMaxResultsChange,
  locationName,
  hasPolygon,
  selectedTypes,
  searchQuery,
  isSearching,
  canSearch,
  onSearch,
  onBack,
}) => (
  <Step>
    <StepLabel>Search Businesses</StepLabel>
    <StepContent>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Set the maximum number of results and click search.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
          Maximum Results: <strong>{maxResults}</strong>
        </Typography>
        <Slider
          value={maxResults}
          onChange={(_, value) => onMaxResultsChange(value as number)}
          min={10}
          max={1000}
          step={10}
          marks={[
            { value: 10, label: '10' },
            { value: 250, label: '250' },
            { value: 500, label: '500' },
            { value: 750, label: '750' },
            { value: 1000, label: '1000' },
          ]}
          valueLabelDisplay="auto"
          sx={{ mt: 1 }}
        />
      </Box>

      <Box sx={{ bgcolor: 'grey.50', p: 2, mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Search Summary:
        </Typography>
        <Typography variant="body2">• Location: {locationName ? `✓ ${locationName}` : '✗ Not set'}</Typography>
        <Typography variant="body2">• Area: {hasPolygon ? '✓ Polygon defined' : '✗ No area selected'}</Typography>
        <Typography variant="body2">
          • Categories: {selectedTypes.length > 0 ? selectedTypes.length + ' selected' : 'None'}
        </Typography>
        {searchQuery && <Typography variant="body2">• Custom Query: "{searchQuery}"</Typography>}
        <Typography variant="body2">• Max Results: {maxResults}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button onClick={onBack}>Back</Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSearching ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
          onClick={onSearch}
          disabled={isSearching || !canSearch}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            },
          }}
        >
          {isSearching ? 'Searching...' : 'Search Businesses'}
        </Button>
      </Box>
    </StepContent>
  </Step>
);

export default SearchStep;

import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { businessTypes } from '../types';

interface SearchPanelProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  hasPolygon: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  selectedTypes,
  onTypesChange,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching,
  hasPolygon,
}) => {
  const [typeFilter, setTypeFilter] = useState('');

  const handleTypeToggle = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onTypesChange(selectedTypes.filter((t) => t !== typeId));
    } else {
      onTypesChange([...selectedTypes, typeId]);
    }
  };

  const handleClearTypes = () => {
    onTypesChange([]);
  };

  const filteredTypes = businessTypes.filter(
    (type) =>
      type.label.toLowerCase().includes(typeFilter.toLowerCase()) ||
      type.id.toLowerCase().includes(typeFilter.toLowerCase())
  );

  const popularTypes = businessTypes.filter((t) => t.popular);

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Search Businesses
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Custom search query */}
        <TextField
          fullWidth
          size="small"
          label="Search Query (optional)"
          placeholder="e.g., pizza, coffee shop, dentist..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Popular types quick select */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
            Popular Categories
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {popularTypes.map((type) => (
              <Chip
                key={type.id}
                label={`${type.icon} ${type.label}`}
                size="small"
                variant={selectedTypes.includes(type.id) ? 'filled' : 'outlined'}
                color={selectedTypes.includes(type.id) ? 'primary' : 'default'}
                onClick={() => handleTypeToggle(type.id)}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>

        {/* All types dropdown */}
        <FormControl fullWidth size="small">
          <InputLabel>Add More Categories</InputLabel>
          <Select
            value=""
            label="Add More Categories"
            onChange={(e) => {
              if (e.target.value && !selectedTypes.includes(e.target.value)) {
                onTypesChange([...selectedTypes, e.target.value]);
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 300 },
              },
            }}
          >
            <Box sx={{ px: 1, py: 0.5, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Filter categories..."
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </Box>
            {filteredTypes.map((type) => (
              <MenuItem key={type.id} value={type.id} disabled={selectedTypes.includes(type.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selected types */}
        {selectedTypes.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Selected ({selectedTypes.length})
              </Typography>
              <Button size="small" onClick={handleClearTypes} startIcon={<Clear />}>
                Clear All
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedTypes.map((typeId) => {
                const type = businessTypes.find((t) => t.id === typeId);
                return (
                  <Chip
                    key={typeId}
                    label={type ? `${type.icon} ${type.label}` : typeId}
                    size="small"
                    color="primary"
                    onDelete={() => handleTypeToggle(typeId)}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Search button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={isSearching ? <CircularProgress size={16} color="inherit" /> : <Search />}
          onClick={onSearch}
          disabled={isSearching || !hasPolygon || (selectedTypes.length === 0 && !searchQuery.trim())}
        >
          {isSearching ? 'Searching...' : 'Search Area'}
        </Button>

        {!hasPolygon && (
          <Typography variant="caption" color="warning.main" textAlign="center">
            Draw a polygon on the map first to define the search area
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default SearchPanel;

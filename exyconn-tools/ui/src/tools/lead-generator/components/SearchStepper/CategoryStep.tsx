import React, { useState } from 'react';
import {
  Box,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Search, Clear, CheckCircle } from '@mui/icons-material';
import { businessTypes } from '../../types';
import { CategoryStepProps } from './types';

const CategoryStep: React.FC<CategoryStepProps> = ({
  selectedTypes,
  onTypesChange,
  searchQuery,
  onSearchQueryChange,
  onBack,
  onNext,
  canProceed,
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
    <Step completed={canProceed}>
      <StepLabel
        optional={
          selectedTypes.length > 0 ? (
            <Typography variant="caption" color="success.main">
              {selectedTypes.length} categories selected
            </Typography>
          ) : searchQuery.trim() ? (
            <Typography variant="caption" color="success.main">
              ✓ Custom query set
            </Typography>
          ) : null
        }
      >
        Select Business Categories
      </StepLabel>
      <StepContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose the types of businesses you want to find, or enter a custom search query.
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Custom Search (optional)"
          placeholder="e.g., pizza, coffee shop, dentist..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
          Popular Categories
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
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

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
            <Box
              sx={{
                px: 1,
                py: 0.5,
                position: 'sticky',
                top: 0,
                bgcolor: 'background.paper',
                zIndex: 1,
              }}
            >
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

        {selectedTypes.length > 0 && (
          <Box sx={{ mb: 2 }}>
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onBack}>Back</Button>
          <Button variant="outlined" onClick={onNext} disabled={!canProceed} endIcon={<CheckCircle />}>
            Continue
          </Button>
        </Box>
      </StepContent>
    </Step>
  );
};

export default CategoryStep;

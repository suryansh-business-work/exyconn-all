import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { ApplyScope, SCOPE_OPTIONS } from '../../types';
import { ScopeSelectorProps } from './types';

const ScopeSelector: React.FC<ScopeSelectorProps> = ({ applyScope, onApplyScopeChange }) => {
  const handleScopeChange = (e: SelectChangeEvent<ApplyScope>) => {
    onApplyScopeChange(e.target.value as ApplyScope);
  };

  return (
    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
      <InputLabel id="scope-label" sx={{ fontSize: '0.75rem' }}>
        Apply To
      </InputLabel>
      <Select
        labelId="scope-label"
        value={applyScope}
        label="Apply To"
        onChange={handleScopeChange}
        sx={{ fontSize: '0.8rem' }}
      >
        {SCOPE_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.value}
            value={opt.value}
            sx={{
              pl: opt.indent ? 4 : 2,
              fontSize: '0.8rem',
              fontWeight: opt.group ? 600 : 400,
            }}
          >
            {opt.emoji} {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ScopeSelector;

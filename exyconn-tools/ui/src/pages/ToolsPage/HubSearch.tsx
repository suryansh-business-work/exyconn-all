import React from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Clear from '@mui/icons-material/Clear';
import Search from '@mui/icons-material/Search';
import { glassSx } from '../../shared/components/Shell/styles';
import type { HubSearchProps } from './types';

/** The hero's search: filters every tool on the hub as you type (kept in `?q=`). */
const HubSearch: React.FC<Readonly<HubSearchProps>> = ({ query, onQueryChange, total }) => (
  <TextField
    fullWidth
    type="search"
    placeholder={`Search ${total} free tools…`}
    value={query}
    onChange={(event) => onQueryChange(event.target.value)}
    slotProps={{
      htmlInput: { 'aria-label': 'Search tools', enterKeyHint: 'search' },
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: query ? (
          <InputAdornment position="end">
            <IconButton aria-label="Clear search" onClick={() => onQueryChange('')} sx={{ width: 44, height: 44 }}>
              <Clear />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      },
    }}
    sx={{
      '& .MuiOutlinedInput-root': { ...glassSx, minHeight: 60, fontSize: '1.05rem', pr: 1 },
      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
      '& .MuiOutlinedInput-root.Mui-focused': { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}` },
    }}
  />
);

export default HubSearch;

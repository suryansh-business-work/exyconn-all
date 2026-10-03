import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Search from '@mui/icons-material/Search';
import { HUB_PATH } from '../../../seo/site';

/** Compact search in the header of category and tool pages; Enter opens the hub filtered. */
const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onKeyDown = (event: React.KeyboardEvent) => {
    const trimmed = query.trim();
    if (event.key === 'Enter' && trimmed) {
      navigate(`${HUB_PATH}?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <TextField
      size="small"
      placeholder="Search tools…"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      onKeyDown={onKeyDown}
      slotProps={{
        htmlInput: { 'aria-label': 'Search tools', enterKeyHint: 'search' },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ width: { md: 220, lg: 280 }, '& .MuiOutlinedInput-root': { height: 44, bgcolor: 'action.hover' } }}
    />
  );
};

export default HeaderSearch;

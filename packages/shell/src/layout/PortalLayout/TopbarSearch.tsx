import { useMemo } from 'react';
import { Autocomplete, InputAdornment, TextField } from '@/components/ui';
import SearchIcon from '@mui/icons-material/Search';
import { accessibleModules, type ModuleDefinition } from '@/config/modules';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';

interface TopbarSearchProps {
  roles: Role[];
}

/** Global header search that jumps to any module the user can access. */
export function TopbarSearch({ roles }: TopbarSearchProps) {
  const navigateTo = useCrossAppNavigate();
  const options = useMemo(() => accessibleModules(roles), [roles]);

  return (
    <Autocomplete<ModuleDefinition>
      options={options}
      getOptionLabel={(option) => option.label}
      onChange={(_event, value) => value && navigateTo(value.key, value.path)}
      blurOnSelect
      clearOnEscape
      sx={{ width: { xs: 160, sm: 240, md: 320 }, mr: 1 }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search…"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}

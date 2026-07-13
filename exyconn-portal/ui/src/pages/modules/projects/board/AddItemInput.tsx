import { useState } from 'react';
import { Box, Button, Flex, TextField } from '@/components/ui';
import AddIcon from '@mui/icons-material/Add';

interface AddItemInputProps {
  label: string;
  placeholder: string;
  onAdd: (value: string) => void;
}

/** Inline "+ Add" control that expands into a text field on click. */
export function AddItemInput({ label, placeholder, onAdd }: AddItemInputProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ justifyContent: 'flex-start' }}
      >
        {label}
      </Button>
    );
  }

  return (
    <Box>
      <TextField
        autoFocus
        fullWidth
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <Flex direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="contained" onClick={submit}>
          Add
        </Button>
        <Button size="small" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </Flex>
    </Box>
  );
}

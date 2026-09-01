import React from 'react';
import { Box, Typography, FormControlLabel, Radio, Chip, TextField } from '@mui/material';
import { BgRemovalProvider } from './BackgroundRemovalDialog';

interface ProviderOptionProps {
  value: BgRemovalProvider;
  currentProvider: BgRemovalProvider;
  icon: React.ReactNode;
  title: string;
  description: string;
  chips: Array<{ label: string; color: 'success' | 'info' | 'warning' }>;
  onSelect: () => void;
  apiKeyField?: {
    value: string;
    onChange: (value: string) => void;
    helperText: React.ReactNode;
  };
  opacity?: number;
}

const ProviderOption: React.FC<ProviderOptionProps> = ({
  value,
  currentProvider,
  icon,
  title,
  description,
  chips,
  onSelect,
  apiKeyField,
  opacity = 1,
}) => {
  const isSelected = currentProvider === value;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 2,
        mb: 2,
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        cursor: 'pointer',
        opacity,
      }}
      onClick={onSelect}
    >
      <FormControlLabel
        value={value}
        control={<Radio checked={isSelected} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography fontWeight={600}>{title}</Typography>
            {chips.map((chip, index) => (
              <Chip
                key={index}
                label={chip.label}
                size="small"
                color={chip.color}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            ))}
          </Box>
        }
      />
      <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
        {description}
      </Typography>

      {apiKeyField && isSelected && (
        <TextField
          fullWidth
          size="small"
          label="Remove.bg API Key"
          placeholder="Enter your API key"
          value={apiKeyField.value}
          onChange={(e) => apiKeyField.onChange(e.target.value)}
          type="password"
          sx={{ mt: 2, ml: 4, width: 'calc(100% - 32px)' }}
          helperText={apiKeyField.helperText}
        />
      )}
    </Box>
  );
};

export default ProviderOption;

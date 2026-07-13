import React from 'react';
import {
  Box, Typography, TextField, IconButton, Button, Chip,
  InputAdornment, Divider, Tooltip, Link as MuiLink,
} from '@mui/material';
import {
  Visibility, VisibilityOff, CheckCircle, OpenInNew,
  ContentCopy, Delete, Save, Info,
} from '@mui/icons-material';
import { SecretField } from './secretsConfig';

interface SecretFieldItemProps {
  field: SecretField;
  value: string;
  isVisible: boolean;
  isSaved: boolean;
  isCopied: boolean;
  onValueChange: (value: string) => void;
  onToggleVisibility: () => void;
  onSave: () => void;
  onClear: () => void;
  onCopy: () => void;
}

const SecretFieldItem: React.FC<SecretFieldItemProps> = ({
  field, value, isVisible, isSaved, isCopied,
  onValueChange, onToggleVisibility, onSave, onClear, onCopy,
}) => (
  <Box sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" fontWeight={600} fontSize={12}>{field.label}</Typography>
      {isSaved && (
        <Chip size="small" icon={<CheckCircle sx={{ fontSize: '12px !important' }} />}
          label="Saved" color="success" variant="outlined"
          sx={{ height: 20, fontSize: '0.65rem' }} />
      )}
    </Box>
    <TextField fullWidth size="small" placeholder={field.placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      type={isVisible ? 'text' : 'password'}
      InputProps={{
        sx: { fontSize: '0.8rem', fontFamily: 'monospace' },
        endAdornment: (
          <InputAdornment position="end">
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              <Tooltip title={isVisible ? 'Hide' : 'Show'}>
                <IconButton size="small" onClick={onToggleVisibility}>
                  {isVisible ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
              {value && (
                <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
                  <IconButton size="small" onClick={onCopy}>
                    <ContentCopy sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </InputAdornment>
        ),
      }}
    />
    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
      <Button size="small" variant="contained" startIcon={<Save sx={{ fontSize: '14px !important' }} />}
        onClick={onSave} sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25 }}>
        Save
      </Button>
      {isSaved && (
        <Button size="small" color="error" startIcon={<Delete sx={{ fontSize: '14px !important' }} />}
          onClick={onClear} sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25 }}>
          Clear
        </Button>
      )}
    </Box>

    <Divider sx={{ my: 1.5 }} />

    <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Info sx={{ fontSize: 14, color: 'info.main' }} />
        <Typography variant="caption" fontWeight={600} color="info.main">How to get this key</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" component="pre"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', m: 0, lineHeight: 1.6 }}>
        {field.instruction}
      </Typography>
      <MuiLink href={field.helpUrl} target="_blank" rel="noopener noreferrer"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.75, fontSize: '0.75rem' }}>
        Open Console <OpenInNew sx={{ fontSize: 12 }} />
      </MuiLink>
    </Box>
  </Box>
);

export default SecretFieldItem;

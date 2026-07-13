import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { UserAgentRule } from './types';

interface UserAgentRulesSectionProps {
  rules: UserAgentRule[];
  onAddRule: () => void;
  onRemoveRule: (id: string) => void;
  onUpdateRule: (id: string, field: keyof UserAgentRule, value: string | string[]) => void;
  onAddPath: (ruleId: string, type: 'allow' | 'disallow') => void;
  onUpdatePath: (ruleId: string, type: 'allow' | 'disallow', index: number, value: string) => void;
  onRemovePath: (ruleId: string, type: 'allow' | 'disallow', index: number) => void;
}

const PathEditor: React.FC<{
  label: string;
  paths: string[];
  ruleId: string;
  type: 'allow' | 'disallow';
  onAdd: (ruleId: string, type: 'allow' | 'disallow') => void;
  onUpdate: (ruleId: string, type: 'allow' | 'disallow', index: number, value: string) => void;
  onRemove: (ruleId: string, type: 'allow' | 'disallow', index: number) => void;
}> = ({ label, paths, ruleId, type, onAdd, onUpdate, onRemove }) => (
  <Box sx={{ mb: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <Typography variant="caption" fontWeight={600}>
        {label}:
      </Typography>
      <Chip size="small" label="+" onClick={() => onAdd(ruleId, type)} />
    </Box>
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {paths.map((path, i) => (
        <Chip
          key={i}
          size="small"
          label={
            <TextField
              variant="standard"
              size="small"
              value={path}
              onChange={(e) => onUpdate(ruleId, type, i, e.target.value)}
              sx={{ width: 80 }}
              InputProps={{ disableUnderline: true, sx: { fontSize: 12 } }}
            />
          }
          onDelete={() => onRemove(ruleId, type, i)}
        />
      ))}
    </Stack>
  </Box>
);

const UserAgentRulesSection: React.FC<UserAgentRulesSectionProps> = ({
  rules,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  onAddPath,
  onUpdatePath,
  onRemovePath,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, maxHeight: 280, overflow: 'auto' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          User Agent Rules
        </Typography>
        <Button size="small" startIcon={<Add />} onClick={onAddRule}>
          Add Rule
        </Button>
      </Box>

      {rules.map((rule) => (
        <Box key={rule.id} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>User-Agent</InputLabel>
              <Select
                value={rule.userAgent}
                onChange={(e) => onUpdateRule(rule.id, 'userAgent', e.target.value)}
                label="User-Agent"
              >
                <MenuItem value="*">* (All bots)</MenuItem>
                <MenuItem value="Googlebot">Googlebot</MenuItem>
                <MenuItem value="Bingbot">Bingbot</MenuItem>
                <MenuItem value="GPTBot">GPTBot</MenuItem>
                <MenuItem value="CCBot">CCBot</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" onClick={() => onRemoveRule(rule.id)} disabled={rules.length === 1}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>

          <PathEditor
            label="Disallow"
            paths={rule.disallow}
            ruleId={rule.id}
            type="disallow"
            onAdd={onAddPath}
            onUpdate={onUpdatePath}
            onRemove={onRemovePath}
          />
          <PathEditor
            label="Allow"
            paths={rule.allow}
            ruleId={rule.id}
            type="allow"
            onAdd={onAddPath}
            onUpdate={onUpdatePath}
            onRemove={onRemovePath}
          />
        </Box>
      ))}
    </Paper>
  );
};

export default UserAgentRulesSection;

import React from 'react';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Key from '@mui/icons-material/Key';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import { useTheme } from '../../../context/ThemeContext';
import { useSecrets } from '../../../context/SecretsContext';
import { hasSecret } from '../../../services/secrets';
import { secretsConfig } from '../../SecretsDrawer/secretsConfig';
import { iconButtonSx } from '../styles';

/** API keys drawer and colour mode — the controls every page header carries. */
const HeaderActions: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const { openSecrets } = useSecrets();
  // Read on every render; the drawer opening or closing (the only moments a key can change)
  // re-renders this through the secrets context.
  const anyKeyConfigured = secretsConfig.some((field) => hasSecret(field.key));
  const nextMode = mode === 'light' ? 'dark' : 'light';

  return (
    <>
      <Tooltip title="API keys & secrets">
        <IconButton aria-label="API keys and secrets" onClick={() => openSecrets()} sx={iconButtonSx}>
          <Badge variant="dot" color="warning" invisible={anyKeyConfigured}>
            <Key fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title={`Switch to ${nextMode} mode`}>
        <IconButton aria-label={`Switch to ${nextMode} mode`} onClick={toggleTheme} sx={iconButtonSx}>
          {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
        </IconButton>
      </Tooltip>
    </>
  );
};

export default HeaderActions;

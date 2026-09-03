import { useState } from 'react';
import { Box, Tab, Tabs } from '@exyconn/shell/components/ui';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import EmailIcon from '@mui/icons-material/Email';
import { glass } from '@exyconn/shell/components/glass/glass';
import { SlackConfigsPanel } from './SlackConfigsPanel';
import { ImageConfigsPanel } from './ImageConfigsPanel';
import { EmailConfigsPanel } from './EmailConfigsPanel';

/** One tab per integration, in the order they appear on the Environment Variables screen. */
const PANELS = [
  { key: 'slack', label: 'Slack', icon: <ChatIcon />, Panel: SlackConfigsPanel },
  { key: 'imagekit', label: 'ImageKit', icon: <ImageIcon />, Panel: ImageConfigsPanel },
  { key: 'smtp', label: 'SMTP', icon: <EmailIcon />, Panel: EmailConfigsPanel },
];

/**
 * Environment Variables — the integration credentials the whole platform runs on,
 * stored in the database rather than in a .env file so they can be rotated and
 * verified here without a redeploy.
 */
export function EnvironmentVariablesPage() {
  const [tab, setTab] = useState(0);
  const ActivePanel = PANELS[tab].Panel;

  return (
    <Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        {PANELS.map((panel) => (
          <Tab key={panel.key} icon={panel.icon} iconPosition="start" label={panel.label} />
        ))}
      </Tabs>
      <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
        <ActivePanel />
      </Box>
    </Box>
  );
}

import { useState } from 'react';
import { Box, Tab, Tabs } from '@exyconn/shell/components/ui';
import EmailIcon from '@mui/icons-material/Email';
import ImageIcon from '@mui/icons-material/Image';
import { glass } from '@exyconn/shell/components/glass/glass';
import { EmailConfigsPanel } from './EmailConfigsPanel';
import { ImageConfigsPanel } from './ImageConfigsPanel';

/** Tech module — manage Email & Image-upload integrations from the database. */
export function TechPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<EmailIcon />} iconPosition="start" label="Email" />
        <Tab icon={<ImageIcon />} iconPosition="start" label="Image Upload" />
      </Tabs>
      <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
        {tab === 0 ? <EmailConfigsPanel /> : <ImageConfigsPanel />}
      </Box>
    </Box>
  );
}

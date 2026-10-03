import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { ChatPreview } from '../../../../components/wa/preview';

interface PreviewPaneProps {
  bundle: DemoBundle;
  startWorkflow: string;
  onClose: () => void;
}

/**
 * The draft running in the real WhatsApp chat, in memory: nothing is saved or counted.
 * Restart mounts a fresh chat, so an edit applied on the canvas is played from the top.
 */
export function PreviewPane({ bundle, startWorkflow, onClose }: Readonly<PreviewPaneProps>) {
  const t = useT();
  const [run, setRun] = useState(0);
  return (
    <Flex direction="column" sx={{ height: '100%', minHeight: 0 }}>
      <Flex
        alignItems="center"
        gap={1}
        sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Text component="h2" size="lg" weight="semibold" sx={{ flexGrow: 1 }}>
          {t('Preview')}
        </Text>
        <Button size="small" startIcon={<RestartAltIcon />} onClick={() => setRun((n) => n + 1)}>
          {t('Restart')}
        </Button>
        <IconButton aria-label={t('Close preview')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Flex>
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatPreview key={run} bundle={bundle} startWorkflow={startWorkflow} />
      </Box>
    </Flex>
  );
}

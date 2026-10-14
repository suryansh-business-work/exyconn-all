import { useState, type ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import type { NodeType } from '@exyconn/wa-flow';
import AddIcon from '@mui/icons-material/Add';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { Badge, Box, Button, Dialog, Drawer, Flex } from '@exyconn/shell/components/ui';
import { NodePalette } from './canvas/NodePalette';

interface PhoneEditorChromeProps {
  errors: number;
  /** The inspector drawer is open while a node is selected. */
  inspectorOpen: boolean;
  onCloseInspector: () => void;
  onAdd: (type: NodeType) => void;
  previewOpen: boolean;
  onClosePreview: () => void;
  inspector: ReactNode;
  problems: ReactNode;
  preview: ReactNode;
}

/**
 * On a phone the side panels become drawers: the palette and the problem list open from a
 * toolbar, the inspector slides up while a node is selected, and the preview is full screen.
 */
export function PhoneEditorChrome(props: Readonly<PhoneEditorChromeProps>) {
  const t = useT();
  const [panel, setPanel] = useState<'none' | 'palette' | 'problems'>('none');
  const close = () => setPanel('none');
  const add = (type: NodeType) => {
    close();
    props.onAdd(type);
  };

  return (
    <>
      <Flex direction="row" gap={1} sx={{ px: 1, py: 0.5, borderTop: 1, borderColor: 'divider' }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setPanel('palette')}>
          {t('Add node')}
        </Button>
        <Button
          size="small"
          color={props.errors > 0 ? 'error' : 'inherit'}
          startIcon={
            <Badge badgeContent={props.errors} color="error">
              <ReportProblemOutlinedIcon />
            </Badge>
          }
          onClick={() => setPanel('problems')}
        >
          {t('Problems')}
        </Button>
      </Flex>
      <Drawer anchor="left" open={panel === 'palette'} onClose={close}>
        <Box sx={{ width: 280 }}>
          <NodePalette onAdd={add} />
        </Box>
      </Drawer>
      <Drawer anchor="bottom" open={panel === 'problems'} onClose={close}>
        <Box sx={{ maxHeight: '70dvh', overflowY: 'auto' }}>{props.problems}</Box>
      </Drawer>
      <Drawer anchor="bottom" open={props.inspectorOpen} onClose={props.onCloseInspector}>
        <Box sx={{ maxHeight: '85dvh', overflowY: 'auto' }}>{props.inspector}</Box>
      </Drawer>
      <Dialog fullScreen open={props.previewOpen} onClose={props.onClosePreview}>
        {props.preview}
      </Dialog>
    </>
  );
}

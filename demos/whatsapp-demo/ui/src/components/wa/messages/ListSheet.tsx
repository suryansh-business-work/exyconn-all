import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Dialog, Drawer, IconButton } from '@exyconn/shell/components/ui';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { BotContent, RenderedOption } from '@exyconn/wa-flow';
import { useCompact, useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { ListSheetRows } from './ListSheetRows';

interface ListSheetProps {
  content: Extract<BotContent, { type: 'list' }>;
  open: boolean;
  onClose: () => void;
}

/** A list message's options: a bottom sheet on a phone, a dialog on a wide screen. */
export function ListSheet({ content, open, onClose }: Readonly<ListSheetProps>) {
  const t = useT();
  const c = useWaPalette();
  const compact = useCompact();
  const { choose } = useChatActions();
  const [picked, setPicked] = useState<RenderedOption | null>(null);

  const send = (option: RenderedOption) => {
    choose(option, content.text);
    setPicked(null);
    onClose();
  };

  const body = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
        bgcolor: c.panel,
        color: c.text,
        fontFamily: 'inherit',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: WA_SPACE.sm,
          p: WA_SPACE.sm,
          borderBottom: `${WA_LINE.hair} solid ${c.divider}`,
        }}
      >
        <IconButton aria-label={t('Close')} onClick={onClose} sx={{ color: c.icon }}>
          <CloseIcon />
        </IconButton>
        <Box
          component="h2"
          id="wa-list-title"
          sx={{ m: 0, flex: 1, textAlign: 'center', fontSize: WA_FONT.title, fontWeight: 600 }}
        >
          {content.button}
        </Box>
        <Box sx={{ width: WA_SIZE.iconButton }} />
      </Box>
      <ListSheetRows sections={content.sections} picked={picked?.id} onPick={setPicked} />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: WA_SPACE.md,
          borderTop: `${WA_LINE.hair} solid ${c.divider}`,
        }}
      >
        <IconButton
          aria-label={t('Send')}
          disabled={!picked}
          onClick={picked ? () => send(picked) : undefined}
          sx={{
            bgcolor: c.brand,
            color: c.onBrandBar,
            width: WA_SIZE.iconButton,
            height: WA_SIZE.iconButton,
            borderRadius: WA_RADIUS.pill,
            '&:hover': { bgcolor: c.brand },
            '&.Mui-disabled': { bgcolor: c.divider, color: c.textMuted },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  if (compact) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            'aria-labelledby': 'wa-list-title',
            sx: {
              borderTopLeftRadius: WA_RADIUS.sheet,
              borderTopRightRadius: WA_RADIUS.sheet,
              bgcolor: c.panel,
            },
          },
        }}
      >
        {body}
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="wa-list-title" fullWidth maxWidth="xs">
      {body}
    </Dialog>
  );
}

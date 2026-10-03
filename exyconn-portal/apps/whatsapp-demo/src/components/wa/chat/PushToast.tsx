import { useT } from '@exyconn/i18n';
import { Box, ButtonBase, Snackbar } from '@exyconn/shell/components/ui';
import type { CatalogBundle } from '../../../runtime/types';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SHADOW, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { WaAvatar } from '../common/WaAvatar';

export interface ArrivedToast {
  id: string;
  demoKey: string;
  text: string;
}

interface PushToastProps {
  toast: ArrivedToast | null;
  bundle?: CatalogBundle;
  onOpen: (demoKey: string) => void;
  onClose: () => void;
}

const TOAST_MS = 6000;

/** A message that arrived on its own in another chat — silent, like a banner notification. */
export function PushToast({ toast, bundle, onOpen, onClose }: Readonly<PushToastProps>) {
  const t = useT();
  const c = useWaPalette();
  return (
    <Snackbar
      key={toast?.id}
      open={Boolean(toast && bundle)}
      autoHideDuration={TOAST_MS}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <ButtonBase
        onClick={() => {
          if (toast) {
            onOpen(toast.demoKey);
          }
          onClose();
        }}
        aria-label={t('New message from {name}', { name: bundle?.demo.business.name ?? '' })}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: WA_SPACE.md,
          width: WA_SIZE.listMin,
          maxWidth: '92vw',
          p: WA_SPACE.md,
          borderRadius: WA_RADIUS.sheet,
          bgcolor: c.panel,
          color: c.text,
          boxShadow: WA_SHADOW.toast,
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        {bundle ? (
          <WaAvatar
            size={WA_SIZE.avatarHeader}
            accent={bundle.demo.business.accent}
            icon={bundle.demo.business.icon}
          />
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ fontWeight: 600, fontSize: WA_FONT.preview }}>
            {bundle?.demo.business.name}
          </Box>
          <Box
            sx={{
              fontSize: WA_FONT.small,
              color: c.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {toast?.text}
          </Box>
        </Box>
      </ButtonBase>
    </Snackbar>
  );
}

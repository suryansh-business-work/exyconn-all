import { useT } from '@exyconn/i18n';
import { Box, Button, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';

/** Read by screen readers, not drawn: the standard clip-to-nothing pattern. */
const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

interface PermissionSaveBarProps {
  count: number;
  busy: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * One save for the whole matrix, stuck to the bottom of the panel while anything is changed.
 * The count is announced from a live region that is always present — one that appears only
 * with the bar would not be read out.
 */
export function PermissionSaveBar({
  count,
  busy,
  onSave,
  onDiscard,
}: Readonly<PermissionSaveBarProps>) {
  const t = useT();
  const message = t('{count} module(s) changed — switching role discards them.', { count });
  return (
    <>
      <Box role="status" sx={VISUALLY_HIDDEN}>
        {count > 0 ? message : ''}
      </Box>
      {count > 0 && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            mt: 1,
            px: 2,
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Flex direction="row" alignItems="center" justifyContent="space-between" wrap spacing={1}>
            <Text size="sm" weight="medium">
              {message}
            </Text>
            <Flex direction="row" spacing={1}>
              <Button variant="text" onClick={onDiscard} disabled={busy}>
                {t('Discard')}
              </Button>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={busy}
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {busy ? t('Saving…') : t('Save changes')}
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </>
  );
}

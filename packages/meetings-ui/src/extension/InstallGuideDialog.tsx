import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Text,
} from '@exyconn/shell/components/ui';

/** The steps to load the internal build, in order. */
const STEPS = [
  'Download the internal ZIP and note its SHA-256 checksum.',
  'Extract the ZIP to a folder you will keep — Chrome loads the extension from it.',
  'Open {address} in Chrome.',
  'Turn on Developer mode (top right).',
  'Click Load unpacked.',
  'Choose the extracted folder — the one that contains manifest.json.',
] as const;

/** Chrome's extensions page. Written as text: a web page cannot link to a chrome:// address. */
const EXTENSIONS_ADDRESS = 'chrome://extensions';

/** How to install the internal ZIP build by hand. */
export function InstallGuideDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('Installation guide')}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t(
            'Chrome cannot install a ZIP or CRX file in one click. Until the extension is on the Chrome Web Store, load it as an unpacked extension.',
          )}
        </Alert>
        <Box component="ol" sx={{ pl: 3, m: 0 }}>
          {STEPS.map((step) => (
            <Box component="li" key={step} sx={{ mb: 1 }}>
              <Text>
                {t(step, {
                  address: EXTENSIONS_ADDRESS,
                })}
              </Text>
            </Box>
          ))}
        </Box>
        <Text size="sm" color="text.secondary" component="p">
          {t('Copy this address into the Chrome address bar:')}{' '}
          <Box component="code" sx={{ userSelect: 'all' }}>
            {EXTENSIONS_ADDRESS}
          </Box>
        </Text>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

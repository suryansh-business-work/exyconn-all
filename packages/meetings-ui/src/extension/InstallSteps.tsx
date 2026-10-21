import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';

/** Chrome's extensions page. Written as text: a web page cannot link to a chrome:// address. */
const EXTENSIONS_ADDRESS = 'chrome://extensions';

/** The step that names the address, which gets a copy button. */
const OPEN_STEP = 'In Chrome, open {address} (copy the address and paste it into the address bar).';

/** How to add the downloaded extension to Chrome, in order and in plain words. */
const STEPS = [
  'Unzip the downloaded file into a folder you will keep. Chrome runs the extension from it.',
  OPEN_STEP,
  'Switch on "Developer mode" in the top right corner.',
  'Click "Load unpacked" and choose the unzipped folder.',
  'Pin the extension from the puzzle-piece button next to the address bar, then click it and sign in with your Exyconn account.',
] as const;

/** The numbered install steps under the download button, and how to update later. */
export function InstallSteps() {
  const t = useT();
  const notify = useNotify();

  const copyAddress = async () => {
    if (await copyToClipboard(EXTENSIONS_ADDRESS)) {
      notify('Address copied', 'success');
    } else {
      notify('Could not copy the address. Type it into the address bar instead.', 'error');
    }
  };

  return (
    <Box>
      <Box component="ol" sx={{ pl: 3, my: 2 }}>
        {STEPS.map((step) => (
          <Box component="li" key={step} sx={{ mb: 1 }}>
            <Text>{t(step, { address: EXTENSIONS_ADDRESS })}</Text>
            {step === OPEN_STEP && (
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyAddress}>
                {t('Copy {address}', { address: EXTENSIONS_ADDRESS })}
              </Button>
            )}
          </Box>
        ))}
      </Box>
      <Text size="sm" color="text.secondary">
        {t(
          'To update: download the new file, unzip it over the old folder, then click the reload arrow on the extension in {address}.',
          { address: EXTENSIONS_ADDRESS },
        )}
      </Text>
    </Box>
  );
}

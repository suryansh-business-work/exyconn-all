import { useMemo, useState } from 'react';
import ImageIcon from '@mui/icons-material/Image';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Text, useTheme } from '@exyconn/shell/components/ui';
import { mailDocument, prepareMailHtml } from './mailHtml';

interface MailBodyProps {
  html: string;
  text: string;
  /** Names the frame for a screen reader, e.g. the sender. */
  label: string;
}

/** Tall enough to show a short message before the frame has measured its content. */
const INITIAL_HEIGHT = 120;

/**
 * A message's body. HTML is shown in a sandboxed frame — no script runs, no form submits, and
 * its styles stay inside — with remote images hidden until "Show images". A plain-text
 * message is shown as text.
 */
export function MailBody({ html, text, label }: Readonly<MailBodyProps>) {
  const t = useT();
  const theme = useTheme();
  const [showImages, setShowImages] = useState(false);
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const prepared = useMemo(
    () => (html ? prepareMailHtml(html, showImages) : null),
    [html, showImages],
  );

  if (!prepared) {
    return (
      <Text size="sm" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {text}
      </Text>
    );
  }

  const style = {
    font: String(theme.typography.fontFamily),
    ink: theme.palette.common.black,
    paper: theme.palette.common.white,
    link: theme.palette.primary.dark,
  };
  const measure = (frame: HTMLIFrameElement) => {
    const content = frame.contentDocument?.documentElement.scrollHeight;
    if (content) {
      setHeight(content);
    }
  };

  return (
    <Box>
      {prepared.images > 0 && !showImages && (
        <Alert
          severity="info"
          icon={<ImageIcon fontSize="small" />}
          sx={{ mb: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowImages(true)}>
              {t('Show images')}
            </Button>
          }
        >
          {t('Images are hidden so the sender cannot tell you opened this.')}
        </Alert>
      )}
      <Box
        component="iframe"
        title={label}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={mailDocument(prepared.html, style, showImages)}
        onLoad={(event) => measure(event.currentTarget as HTMLIFrameElement)}
        sx={{
          display: 'block',
          width: '100%',
          height,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'common.white',
        }}
      />
    </Box>
  );
}

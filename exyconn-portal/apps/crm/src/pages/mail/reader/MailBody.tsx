import { useMemo, useState } from 'react';
import { Box, Stack, Text, useTheme } from '@exyconn/shell/components/ui';
import { FoldedQuote } from '../../../records/detail/email/FoldedQuote';
import { TrimmedButton } from '../../../records/detail/email/TrimmedButton';
import { splitQuoted } from '../../../records/detail/email/quotedText';
import { mailDocument, prepareMailHtml } from './mailHtml';

interface MailBodyProps {
  html: string;
  text: string;
  /** Names the frame for a screen reader, e.g. the sender. */
  label: string;
}

/** Tall enough to show a short message before the frame has measured its content. */
const INITIAL_HEIGHT = 120;

/** A plain-text message, with the earlier mail it quotes folded behind "⋯". */
function PlainBody({ text }: Readonly<{ text: string }>) {
  const { main, quoted } = splitQuoted(text);
  return (
    <Stack spacing={1}>
      <Text size="sm" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {main}
      </Text>
      {quoted && <FoldedQuote text={quoted} />}
    </Stack>
  );
}

/**
 * A message's body. HTML is shown in a sandboxed frame — no script runs, no form submits, and
 * its styles stay inside — with its images loaded as it opens and the earlier mail it quotes
 * folded behind "⋯", as Gmail does. A plain-text message is shown as text.
 */
export function MailBody({ html, text, label }: Readonly<MailBodyProps>) {
  const theme = useTheme();
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const [showQuoted, setShowQuoted] = useState(false);
  const prepared = useMemo(() => (html ? prepareMailHtml(html) : null), [html]);

  if (!prepared) {
    return <PlainBody text={text} />;
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
  const shown = showQuoted ? prepared.main + prepared.quoted : prepared.main;

  return (
    <Stack spacing={1}>
      <Box
        component="iframe"
        title={label}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={mailDocument(shown, style)}
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
      {prepared.quoted && (
        <TrimmedButton open={showQuoted} onToggle={() => setShowQuoted(!showQuoted)} />
      )}
    </Stack>
  );
}

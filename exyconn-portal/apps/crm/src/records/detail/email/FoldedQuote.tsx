import { useState } from 'react';
import { Collapse, Stack, Text } from '@exyconn/shell/components/ui';
import { TrimmedButton } from './TrimmedButton';

/** Earlier mail as plain text, folded behind "⋯" until asked for. */
export function FoldedQuote({ text }: Readonly<{ text: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <Stack spacing={1}>
      <TrimmedButton open={open} onToggle={() => setOpen(!open)} />
      <Collapse in={open} unmountOnExit>
        <Text
          size="sm"
          color="text.secondary"
          sx={{
            whiteSpace: 'pre-line',
            overflowWrap: 'anywhere',
            borderLeft: 2,
            borderColor: 'divider',
            pl: 1.5,
          }}
        >
          {text}
        </Text>
      </Collapse>
    </Stack>
  );
}

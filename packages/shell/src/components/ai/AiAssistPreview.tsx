import { Box, Text } from '@/components/ui';

/** Longest excerpt shown before the block scrolls instead of pushing the buttons away. */
const MAX_HEIGHT = 200;

/** One labelled, scrollable block of plain text — the input on the way in, the answer back. */
export function AiAssistPreview({ label, body }: Readonly<{ label: string; body: string }>) {
  return (
    <Box>
      <Text size="label">{label}</Text>
      <Box
        sx={{
          mt: 0.5,
          p: 1.5,
          maxHeight: MAX_HEIGHT,
          overflowY: 'auto',
          borderRadius: 1,
          bgcolor: 'action.hover',
        }}
      >
        <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </Text>
      </Box>
    </Box>
  );
}

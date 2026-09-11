import { Box, Text } from '@exyconn/shell/components/ui';

interface Props {
  title: string;
  text: string;
}

/** A labelled monospace block — a stack, a component stack or a JSON context. */
export function CodeBlock({ title, text }: Readonly<Props>) {
  if (!text) {
    return null;
  }
  return (
    <Box>
      <Text size="sm" weight="semibold" sx={{ mb: 0.5 }}>
        {title}
      </Text>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          fontFamily: 'monospace',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 320,
          overflow: 'auto',
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

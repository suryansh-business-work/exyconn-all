import { useT } from '@exyconn/i18n';
import { Box, Flex, Text, keyframes } from '@exyconn/shell/components/ui';

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-3px); opacity: 1; }
`;

const DOTS = ['first', 'second', 'third'] as const;

/** "Asha is typing…" with three bouncing dots, while the visitor writes. */
export function TypingIndicator({ name }: Readonly<{ name: string }>) {
  const t = useT();
  return (
    <Flex direction="row" spacing={1} alignItems="center" role="status" sx={{ px: 1, py: 0.5 }}>
      <Flex direction="row" spacing={0.5} aria-hidden>
        {DOTS.map((dot, step) => (
          <Box
            key={dot}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'text.secondary',
              animation: `${bounce} 1.2s infinite`,
              animationDelay: `${step * 0.15}s`,
            }}
          />
        ))}
      </Flex>
      <Text size="caption" color="text.secondary">
        {t('{name} is typing…', { name })}
      </Text>
    </Flex>
  );
}

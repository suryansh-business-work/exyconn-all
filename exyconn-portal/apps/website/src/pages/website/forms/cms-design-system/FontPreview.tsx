import { useT } from '@exyconn/i18n';
import { Paper, Text } from '@exyconn/shell/components/ui';
import type { TokenRow } from './cms-design-system.types';

const stackOf = (roles: readonly TokenRow[], key: string, fallback: string) =>
  roles.find((role) => role.key === key)?.value || fallback;

/** Headings, body and code in the stacks being edited (display, sans and mono roles). */
export function FontPreview({ roles }: Readonly<{ roles: readonly TokenRow[] }>) {
  const t = useT();
  const sans = stackOf(roles, 'sans', 'sans-serif');
  const display = stackOf(roles, 'display', sans);
  const mono = stackOf(roles, 'mono', 'monospace');
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Text
        component="div"
        sx={{ fontFamily: display, fontSize: 32, fontWeight: 700, lineHeight: 1.15 }}
      >
        {t('AI that does the work')}
      </Text>
      <Text component="div" sx={{ fontFamily: display, fontSize: 20, fontWeight: 600, mt: 1 }}>
        {t('A second-level heading')}
      </Text>
      <Text component="p" sx={{ fontFamily: sans, fontSize: 16, mt: 1 }}>
        {t(
          'Body text reads in the sans role. The quick brown fox jumps over the lazy dog, 0123456789.',
        )}
      </Text>
      <Text component="pre" sx={{ fontFamily: mono, fontSize: 14, m: 0 }}>
        {'const answer = 42;'}
      </Text>
    </Paper>
  );
}

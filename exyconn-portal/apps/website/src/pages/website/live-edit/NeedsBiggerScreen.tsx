import { useT } from '@exyconn/i18n';
import { Button, Text } from '@exyconn/shell/components/ui';
import { CenteredState } from '@exyconn/shell/components/feedback/CenteredState';

// GrapesJS is a canvas with two rails of controls either side of it. There is no version of
// that which works on a phone, and a half-usable editor over somebody's live page is worse
// than being told where to open it.
/** What a visual editor shows on a phone: where to open it instead, and a way back. */
export function NeedsBiggerScreen({ onBack }: Readonly<{ onBack: () => void }>) {
  const t = useT();
  return (
    <CenteredState>
      <Text weight="bold">{t('Live editing needs a bigger screen')}</Text>
      <Text size="sm" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        {t('Open this page on a laptop to edit its design. You can still edit its content here.')}
      </Text>
      <Button onClick={onBack} sx={{ mt: 2 }}>
        {t('Back')}
      </Button>
    </CenteredState>
  );
}

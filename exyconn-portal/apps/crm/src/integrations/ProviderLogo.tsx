import { useT } from '@exyconn/i18n';
import { Box, Flex } from '@exyconn/shell/components/ui';
import twilioLogo from '../assets/integrations/twilio.svg';
import vobizLogo from '../assets/integrations/vobiz.svg';
import msg91Logo from '../assets/integrations/msg91.svg';
import gmailLogo from '../assets/integrations/gmail.svg';
import outlookLogo from '../assets/integrations/microsoft-outlook.svg';
import { PROVIDER_NAMES } from './providerNames';

/** Each provider's brand mark, bundled locally (never hotlinked). */
const PROVIDER_LOGOS: Readonly<Record<string, string>> = {
  TWILIO: twilioLogo,
  VOBIZ: vobizLogo,
  MSG91: msg91Logo,
  GMAIL: gmailLogo,
  MICROSOFT: outlookLogo,
};

interface ProviderLogoProps {
  /** The provider's enum value, e.g. TWILIO. */
  provider: string;
  /** Edge of the square tile, in px. */
  size?: number;
  /** True when the provider's name is written next to it, so the image adds nothing to read. */
  decorative?: boolean;
}

/** A provider's logo on a light rounded tile, so dark marks stay legible in dark mode. */
export function ProviderLogo({
  provider,
  size = 20,
  decorative = true,
}: Readonly<ProviderLogoProps>) {
  const t = useT();
  const src = PROVIDER_LOGOS[provider];
  if (!src) {
    return null;
  }
  const name = PROVIDER_NAMES[provider];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size,
        height: size,
        p: '2px',
        bgcolor: 'common.white',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={decorative ? '' : t('{provider} logo', { provider: name })}
        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </Box>
  );
}

/** A provider's logo followed by its name, e.g. in a table cell or a select option. */
export function ProviderLabel({ provider }: Readonly<{ provider: string }>) {
  return (
    <Flex direction="row" spacing={1} alignItems="center" component="span">
      <ProviderLogo provider={provider} />
      <span>{PROVIDER_NAMES[provider] ?? provider}</span>
    </Flex>
  );
}

import { YStack } from 'tamagui';
import { copyrightNotice, type Branding } from '@exyconn/tracker-core';
import { Body, Caption } from '../ui/Typography';
import { LinkRow } from './LinkRow';
import { SettingsCard } from './SettingsCard';

interface Props {
  /** The portal's branding; null until it has loaded. Every line here comes from it. */
  branding: Branding | null;
}

/**
 * Who makes this tracker and how to reach them — all from the portal's branding, so the app
 * ships no company name of its own. Rows the administrator left empty are simply absent.
 */
export function AboutCard({ branding }: Readonly<Props>) {
  const name = branding?.businessName ?? '';
  const slogan = branding?.slogan ?? '';
  const supportEmail = branding?.supportEmail ?? '';
  const website = branding?.websiteUrl ?? '';

  return (
    <SettingsCard title="About">
      {name === '' && slogan === '' ? null : (
        <YStack gap="$0.5">
          {name === '' ? null : <Body fontWeight="600">{name}</Body>}
          {slogan === '' ? null : <Caption>{slogan}</Caption>}
        </YStack>
      )}
      {supportEmail === '' ? null : (
        <LinkRow
          label="Support"
          value={supportEmail}
          url={`mailto:${supportEmail}`}
          icon="email-outline"
        />
      )}
      {website === '' ? null : <LinkRow label="Website" value={website} url={website} icon="web" />}
      <Caption>{copyrightNotice(branding)}</Caption>
    </SettingsCard>
  );
}

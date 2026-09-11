import { YStack } from 'tamagui';
import type { ConsentPolicy, TrackerSettings } from '@exyconn/tracker-core';
import { ConsentForm } from '../../forms/consent';
import {
  PHONE_WEBCAM_DISCLOSURE,
  showsWebcamDisclosure,
} from '../../lib/capabilities/phone-records';
import type { Capabilities } from '../../tracker/types';
import { PhoneRecordsList } from '../capabilities/PhoneRecordsList';
import { AppFooter } from '../shell/AppFooter';
import { BrandMark } from '../ui/BrandMark';
import { Notice } from '../ui/Notice';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Surface } from '../ui/Surface';
import { Caption, Heading, Title } from '../ui/Typography';
import { ConsentBody } from './ConsentBody';

interface Props {
  settings: TrackerSettings | null;
  /** The Legal policy behind this disclosure, when the workspace has chosen one. */
  policy: ConsentPolicy | null;
  capabilities: Capabilities;
}

/** The line under the title: which version is being agreed to, and that nothing runs yet. */
function introOf(policy: ConsentPolicy | null): string {
  if (policy === null) {
    return 'Read what this app records while tracking is on. Nothing is captured until you agree and tap Start.';
  }
  const act = policy.requiresAcknowledgement ? 'sign' : 'agree';
  return `Version ${policy.version} of your workspace's policy. Nothing is captured until you ${act} and tap Start.`;
}

/**
 * Consent gate. The disclosure itself is authored in the portal — as a versioned Legal policy
 * when the workspace has chosen one, otherwise as the tracker's own consent text — and
 * rendered verbatim: this app never paraphrases what it records. Tracking only begins once
 * the person explicitly agrees, so there is nothing to nudge here.
 *
 * A policy that requires acknowledgement is SIGNED, not just accepted: the employee types
 * their name, and the signature goes into Legal's ledger against the exact version they were
 * shown. Re-publishing changed wording raises the version and brings them back here, which is
 * the whole point — an agreement to superseded wording is not an agreement to this one.
 *
 * Two things the app states on its own account. The webcam, when it is switched on: the
 * disclosure is the workspace's to write, and being photographed is not something anyone
 * should be able to leave out of it. And what THIS phone can record at all — a disclosure
 * written for laptops describes keystroke counts and window titles a phone never sees.
 */
export function ConsentScreen({ settings, policy, capabilities }: Readonly<Props>) {
  const body = policy?.body ?? settings?.consentText ?? '';
  const hasDisclosure = body.trim() !== '';
  const mustSign = policy?.requiresAcknowledgement === true;

  return (
    <ScreenLayout maxWidth={560}>
      <YStack alignItems="center" paddingVertical="$3">
        <BrandMark height={36} />
      </YStack>

      <Surface padding="$5" gap="$4">
        <YStack gap="$1">
          <Title>{policy?.title ?? 'Before you start'}</Title>
          <Caption>{introOf(policy)}</Caption>
        </YStack>

        {hasDisclosure ? (
          <ConsentBody html={body} />
        ) : (
          <Notice severity="warning">
            Your workspace has not published a monitoring disclosure yet. You cannot agree to
            something that has not been disclosed — ask your administrator to publish it in the
            portal.
          </Notice>
        )}

        {showsWebcamDisclosure(capabilities, settings) ? (
          <Notice severity="warning" icon="camera-outline">
            {PHONE_WEBCAM_DISCLOSURE}
          </Notice>
        ) : null}

        <Heading>What this phone records</Heading>
        <PhoneRecordsList settings={settings} />

        <ConsentForm mustSign={mustSign} canAgree={hasDisclosure} />
      </Surface>
      <AppFooter />
    </ScreenLayout>
  );
}

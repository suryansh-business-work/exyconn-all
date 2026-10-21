import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Flex } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import {
  MaReleaseChannel,
  useMaStartExtensionBuildMutation,
} from '@exyconn/shell/graphql/generated';
import { ReleaseChannelForm } from '../forms/release-channel';
import { useRunNotified } from '../lib/useRunNotified';
import { ReleaseSettingsDialog } from './ReleaseSettingsDialog';

type OpenDialog = 'build' | 'settings' | null;

/** The Releases page's header actions: build a new release, and the release settings. */
export function ReleaseManagerActions() {
  const t = useT();
  const runNotified = useRunNotified();
  const [startBuild] = useMaStartExtensionBuildMutation();
  const [open, setOpen] = useState<OpenDialog>(null);
  const close = () => setOpen(null);

  const build = (channel: MaReleaseChannel) =>
    runNotified(
      () => startBuild({ variables: { channel } }),
      'The build has started. In about ten minutes it appears here, waiting for approval.',
    );

  return (
    <>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setOpen('settings')}>
          {t('Release settings')}
        </Button>
        <Button variant="contained" startIcon={<BuildIcon />} onClick={() => setOpen('build')}>
          {t('Build new release')}
        </Button>
      </Flex>
      <ReleaseSettingsDialog open={open === 'settings'} onClose={close} />
      <CrudDialog open={open === 'build'} title={t('Build new release')} onClose={close}>
        {open === 'build' && (
          <ReleaseChannelForm
            defaultChannel={MaReleaseChannel.Stable}
            submitLabel="Start build"
            onSubmit={build}
            onDone={close}
            onCancel={close}
          />
        )}
      </CrudDialog>
    </>
  );
}

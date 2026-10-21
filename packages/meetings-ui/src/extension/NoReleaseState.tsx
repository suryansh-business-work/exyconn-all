import ExtensionIcon from '@mui/icons-material/Extension';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { appUrl } from '@exyconn/shell/config/apps';
import {
  useMaReleaseOverviewQuery,
  type MaReleaseOverviewQuery,
} from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';

/** Where release managers approve, import and build extension releases (the AI portal). */
const RELEASES_PATH = '/ai/meeting-assistant/releases';

type Overview = MaReleaseOverviewQuery['maReleaseOverview'];

/** What to tell the viewer, and whether to point a release manager at the Releases page. */
function explain(overview: Overview): { title: string; description: string; toReleases: boolean } {
  if (!overview.releaseManager) {
    return {
      title: 'The extension is not available yet',
      description: "Your administrator hasn't published the extension yet. Check back later.",
      toReleases: false,
    };
  }
  if (overview.awaitingApproval > 0) {
    return {
      title: 'A build is waiting for approval',
      description: 'Approve it on the Releases page and choose the channel to offer it on.',
      toReleases: true,
    };
  }
  if (overview.registered > 0) {
    return {
      title: 'No build is ready to download',
      description:
        'Every registered build is deprecated or in store review. Start a new build on the Releases page.',
      toReleases: true,
    };
  }
  return {
    title: 'No build registered yet',
    description:
      'Every merge to main uploads a build. To make one now, click Build new release on the Releases page.',
    toReleases: true,
  };
}

/** Why there is nothing to download: a plain note for people, next steps for release managers. */
export function NoReleaseState() {
  const { data, error, refetch } = useMaReleaseOverviewQuery({
    fetchPolicy: 'cache-and-network',
  });
  if (error) {
    return <LoadError message={error.message} onRetry={() => refetch()} />;
  }
  if (!data) {
    return <PanelSkeleton />;
  }
  const { title, description, toReleases } = explain(data.maReleaseOverview);
  const openReleases = () => globalThis.location.assign(appUrl('ai', RELEASES_PATH));
  return (
    <EmptyState
      icon={<ExtensionIcon />}
      title={title}
      description={description}
      actionLabel={toReleases ? 'Open Releases' : undefined}
      onAction={toReleases ? openReleases : undefined}
    />
  );
}

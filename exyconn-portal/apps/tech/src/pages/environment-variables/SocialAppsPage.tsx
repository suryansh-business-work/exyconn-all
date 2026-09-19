import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { SocialAppsPanel } from './SocialAppsPanel';

/** Where the social apps live in the Tech sidebar. */
export const SOCIAL_APPS_PATH = '/tech/social-apps';

/**
 * Tech › Social apps: the LinkedIn, Meta, X and Google OAuth apps Marketing connects accounts
 * through. Its own page rather than a tenth Environment Variables tab, where it sat off-screen.
 */
export function SocialAppsPage() {
  return (
    <Box sx={readingPanel}>
      <SocialAppsPanel />
    </Box>
  );
}

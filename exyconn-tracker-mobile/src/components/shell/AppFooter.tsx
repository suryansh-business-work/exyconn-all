import { copyrightNotice } from '@exyconn/tracker-core';
import { useBrand } from '../../theme/BrandProvider';
import { Caption } from '../ui/Typography';

/** The workspace's copyright line — authored in the portal, never a name the app ships. */
export function AppFooter() {
  const { branding } = useBrand();
  return (
    <Caption textAlign="center" paddingVertical="$3">
      {copyrightNotice(branding)}
    </Caption>
  );
}

import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { Role } from '@exyconn/shell/graphql/generated';
import { PermissionMatrix } from './PermissionMatrix';

/** ADMIN can never be restricted, so it is not offered. */
const RESTRICTABLE_ROLES = Object.values(Role).filter((r) => r !== ROLES.ADMIN);

/** Route the role tabs live under; the chosen role is a slug beneath it. */
const PERMISSIONS_PATH = '/admin/permissions';

/** One tab per role. Slugs are lower-cased role names, so they read well in a URL. */
const TABS: TabberItem[] = RESTRICTABLE_ROLES.map((role) => ({
  slug: role.toLowerCase(),
  label: role,
  content: <PermissionMatrix role={role} />,
}));

/**
 * Roles & permissions matrix. Pick a role; every module shows what that role may
 * do there. Nothing is restricted until you save a row, so the portal behaves
 * exactly as before until an administrator decides otherwise. The chosen role is
 * a slug in the URL, so a role's matrix can be linked to.
 */
export function PermissionsPage() {
  return (
    <Box>
      <PageHeader title="Roles & Permissions" subtitle="What each role may do in each module" />
      <Box sx={[glass, { p: { xs: 1, md: 2 } }]}>
        <Tabber
          basePath={PERMISSIONS_PATH}
          items={TABS}
          variant="scrollable"
          ariaLabel="Roles"
          sx={{ mb: 1 }}
        />
      </Box>
    </Box>
  );
}

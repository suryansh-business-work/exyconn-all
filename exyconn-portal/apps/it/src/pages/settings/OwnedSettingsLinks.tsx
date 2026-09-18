import { useT } from '@exyconn/i18n';
import { Button, Grid, Stack, Text } from '@exyconn/shell/components/ui';
import { appForPath } from '@exyconn/shell/config/modules';
import { appUrl } from '@exyconn/shell/config/apps';
import { panel } from '@exyconn/shell/components/glass/glass';

/**
 * Settings IT depends on but does not own. Each already has an owner and a screen; IT reads
 * theirs rather than keeping a second copy that would drift.
 */
const OWNED_ELSEWHERE = [
  { label: 'Departments', owner: 'HR', path: '/hr/departments' },
  { label: 'Roles & approval permissions', owner: 'Admin', path: '/admin/permissions' },
  { label: 'Ticket SLA policies', owner: 'Support', path: '/support/sla' },
  { label: 'Vendors', owner: 'Products', path: '/products/suppliers' },
];

/** The same links, resolved to whichever portal serves each one. */
function hrefFor(path: string): string {
  const app = appForPath(path);
  return app ? appUrl(app, path) : path;
}

/** Where the rest of IT's configuration lives. */
export function OwnedSettingsLinks() {
  const t = useT();
  return (
    <Grid container spacing={1.5}>
      {OWNED_ELSEWHERE.map((link) => (
        <Grid key={link.path} size={{ xs: 12, sm: 6, md: 3 }}>
          <Stack spacing={1} sx={[panel, { height: '100%' }]}>
            <Text size="sm" weight="medium">
              {t(link.label)}
            </Text>
            <Text size="caption" color="text.secondary">
              {t('Managed by {owner}', { owner: link.owner })}
            </Text>
            <Button href={hrefFor(link.path)} size="small" variant="outlined">
              {t('Open')}
            </Button>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
}

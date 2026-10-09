import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useT } from '@exyconn/i18n';
import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  fontSize,
} from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { ROLES } from '@/auth/roles';
import {
  OrganizationStatus,
  useMyOrganizationQuery,
  useOrganizationsQuery,
} from '@/graphql/generated';
import { organizationLocation } from '@/config/organizationPath';

const LOGO_SIZE = 28;

/** A company's logo, or its initial when it has none. */
function OrganizationLogo({ name, logoUrl }: Readonly<{ name: string; logoUrl: string }>) {
  return (
    <Avatar
      src={logoUrl || undefined}
      alt=""
      aria-hidden
      variant="rounded"
      sx={{ width: LOGO_SIZE, height: LOGO_SIZE, fontSize: fontSize.sm, bgcolor: 'primary.main' }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
}

/**
 * Picks the company a platform administrator works in. Shown only to a SUPER_ADMIN, and only
 * when there is more than one open company to choose from.
 *
 * Choosing one loads the same page under that company's address (`/organization/:slug/...`):
 * a full load, so nothing of the previous company survives in the cache.
 */
export function OrganizationSwitcher() {
  const t = useT();
  const { user } = useAuth();
  const platformAdmin = user?.roles.includes(ROLES.SUPER_ADMIN) ?? false;
  const { data } = useOrganizationsQuery({ skip: !platformAdmin });
  const { data: current } = useMyOrganizationQuery({ skip: !platformAdmin });
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const choices = (data?.organizations ?? []).filter(
    (organization) => organization.status === OrganizationStatus.Active,
  );
  if (choices.length < 2) {
    return null;
  }
  const active = current?.myOrganization ?? null;
  const activeName = active?.name ?? t('Organization');

  const choose = (slug: string) => {
    setAnchorEl(null);
    if (slug !== active?.slug) {
      globalThis.location.assign(organizationLocation(slug));
    }
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label={t('Organization: {name}', { name: activeName })}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        startIcon={active ? <OrganizationLogo name={active.name} logoUrl={active.logoUrl} /> : null}
        endIcon={<ExpandMoreIcon />}
        sx={{ mr: 1, textTransform: 'none', minWidth: 0 }}
      >
        {/* A phone keeps the logo only; the button's name still says which company. */}
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {activeName}
        </Box>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {choices.map((organization) => (
          <MenuItem
            key={organization.id}
            selected={organization.slug === active?.slug}
            onClick={() => choose(organization.slug)}
          >
            <ListItemIcon>
              <OrganizationLogo name={organization.name} logoUrl={organization.logoUrl} />
            </ListItemIcon>
            <ListItemText primary={organization.name} secondary={organization.slug} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

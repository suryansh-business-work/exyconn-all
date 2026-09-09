import { useState } from 'react';
import AppsIcon from '@mui/icons-material/Apps';
import { Button } from '@exyconn/shell/components/ui';
import { PortalSwitcher } from '@exyconn/shell/layout/PortalSwitcher';

interface OtherPortalsLinkProps {
  /** Portal accent from branding, so the link belongs to the front door it sits on. */
  accentColor: string;
}

/**
 * The way out of a front door that only serves one portal: opens the same switcher the
 * sidebar uses, listing every portal with a search box. Nobody has signed in yet, so the
 * portal that is picked decides what happens — the session cookie is shared across the
 * subdomains, so a visitor who already has one lands inside it, and everyone else lands
 * on its login screen.
 */
export function OtherPortalsLink({ accentColor }: Readonly<OtherPortalsLinkProps>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="small"
        startIcon={<AppsIcon />}
        onClick={() => setOpen(true)}
        sx={{ color: accentColor, px: 0, minWidth: 0 }}
      >
        Other Portals
      </Button>
      <PortalSwitcher roles={null} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

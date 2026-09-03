import { getYear } from 'date-fns';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Branding } from '@shared/types';

const DEFAULT_OWNER = 'Exyconn';

interface Props {
  branding: Branding | null;
}

/** Whoever the portal says owns the product: the legal name, else the trading name. */
function ownerOf(branding: Branding | null): string {
  const legal = branding?.legalName ?? '';
  if (legal !== '') {
    return legal;
  }
  const business = branding?.businessName ?? '';
  return business === '' ? DEFAULT_OWNER : business;
}

/**
 * The copyright notice, exactly as the portal's own website builds it: the admin can author
 * the whole line in the branding settings, and when they have not, it is composed from the
 * legal name and this year. Either way the app ships no company name of its own.
 */
function noticeOf(branding: Branding | null): string {
  const authored = branding?.copyrightText ?? '';
  if (authored !== '') {
    return authored;
  }
  return `© ${getYear(new Date())} ${ownerOf(branding)}. All rights reserved.`;
}

export default function AppFooter({ branding }: Readonly<Props>): JSX.Element {
  return (
    <Box sx={{ flexShrink: 0, px: 2, pb: 1.5, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {noticeOf(branding)}
      </Typography>
    </Box>
  );
}

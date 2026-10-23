import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import { densePanel, panel } from '@exyconn/shell/components/glass/glass';

interface MailLayoutProps {
  /** A conversation is open. */
  reading: boolean;
  rail: ReactNode;
  list: ReactNode;
  reader: ReactNode;
}

/** The rail's width on a wide screen. */
const RAIL_WIDTH = 260;

/**
 * Three panes on a wide screen: the rail, the list, and the reader beside the list while a
 * conversation is open. On a phone or tablet the rail moves into a drawer and the reader
 * takes the list's place, with Back to return to it.
 */
export function MailLayout({ reading, rail, list, reader }: Readonly<MailLayoutProps>) {
  const t = useT();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const [drawer, setDrawer] = useState(false);
  const { pathname, search } = useLocation();

  // Choosing a folder or a mailbox in the drawer changes the address; the drawer then closes.
  useEffect(() => {
    setDrawer(false);
  }, [pathname, search]);

  if (!wide) {
    return (
      <Stack spacing={1.5}>
        <Box>
          <IconButton onClick={() => setDrawer(true)} aria-label={t('Folders and mailboxes')}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer open={drawer} onClose={() => setDrawer(false)}>
          <Box sx={{ width: RAIL_WIDTH, p: 2 }}>{rail}</Box>
        </Drawer>
        <Stack spacing={1.5} sx={panel}>
          {reading ? reader : list}
        </Stack>
      </Stack>
    );
  }

  const columns = reading
    ? `${RAIL_WIDTH}px minmax(320px, 2fr) minmax(0, 3fr)`
    : `${RAIL_WIDTH}px minmax(0, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 2, alignItems: 'start' }}>
      <Box sx={densePanel}>{rail}</Box>
      <Stack spacing={1.5} sx={[panel, { minWidth: 0 }]}>
        {list}
      </Stack>
      {reading && <Box sx={[panel, { minWidth: 0 }]}>{reader}</Box>}
    </Box>
  );
}

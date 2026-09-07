import { useLocation, useNavigate } from 'react-router-dom';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import {
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  Tooltip,
  Typography,
} from '@exyconn/shell/components/ui';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { usePublicBrandingQuery } from '@exyconn/shell/graphql/generated';

/** Shown only until Branding has answered; never as a substitute for it. */
const LOADING_TITLE = 'Exyconn Status';

/** The company mark, or the generic heartbeat while branding is still loading. */
function BrandMark({ logoUrl, name }: Readonly<{ logoUrl: string; name: string }>) {
  if (!logoUrl) {
    return <MonitorHeartIcon color="primary" />;
  }
  return <Box component="img" src={logoUrl} alt={name} sx={{ height: 28, width: 'auto' }} />;
}

/** Brand bar of the public status site: identity, colour mode and the report action. */
export function StatusHeader() {
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const onReportPage = useLocation().pathname === '/report';
  const isDark = mode === 'dark';
  const { data } = usePublicBrandingQuery();
  const branding = data?.publicBranding;
  const title = branding ? `${branding.businessName} Status` : LOADING_TITLE;
  const logoUrl = (isDark ? branding?.logoDarkUrl : branding?.logoUrl) ?? '';

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container>
        <Flex alignItems="center" justifyContent="space-between" spacing={2} sx={{ py: 1.5 }}>
          <Flex alignItems="center" spacing={1.5}>
            <BrandMark logoUrl={logoUrl} name={title} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Live availability of every service
              </Typography>
            </Box>
          </Flex>
          <Flex alignItems="center" spacing={1}>
            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={toggle} aria-label="Toggle colour mode">
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant={onReportPage ? 'outlined' : 'contained'}
              startIcon={onReportPage ? undefined : <ReportProblemIcon />}
              onClick={() => navigate(onReportPage ? '/' : '/report')}
            >
              {onReportPage ? 'Back to status' : 'Report a problem'}
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

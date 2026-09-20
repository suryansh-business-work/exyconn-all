import { useLocation, useNavigate } from 'react-router-dom';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  Tooltip,
  Typography,
  zIndex,
  fontWeight,
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
  const t = useT();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const onReportPage = path === '/report';
  const onHelpPage = path === '/help';
  // Both actions collapse to one "back" on their own page: two ways out of the same screen
  // is a choice nobody wants to make.
  const away = onReportPage || onHelpPage;
  const isDark = mode === 'dark';
  const { data } = usePublicBrandingQuery();
  const branding = data?.publicBranding;
  const title = branding
    ? t('{business} Status', { business: branding.businessName })
    : t(LOADING_TITLE);
  const logoUrl = (isDark ? branding?.logoDarkUrl : branding?.logoUrl) ?? '';

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: zIndex.sticky,
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
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: fontWeight.bold,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('Live availability of every service')}
              </Typography>
            </Box>
          </Flex>
          <Flex alignItems="center" spacing={1}>
            <Tooltip title={isDark ? t('Switch to light mode') : t('Switch to dark mode')}>
              <IconButton onClick={toggle} aria-label={t('Toggle colour mode')}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            {away ? (
              <Button variant="outlined" onClick={() => navigate('/')}>
                {t('Back to status')}
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SupportAgentIcon />}
                  onClick={() => navigate('/help')}
                >
                  {t('Get help')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ReportProblemIcon />}
                  onClick={() => navigate('/report')}
                >
                  {t('Report a problem')}
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

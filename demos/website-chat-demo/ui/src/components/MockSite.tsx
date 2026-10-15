import { useT } from '@exyconn/i18n';
import type { CatalogBundle } from '@exyconn/bot-studio/runtime';
import { WA_ICONS } from '@exyconn/bot-studio/icons';
import { useWidgetLook } from '@exyconn/bot-studio/widget';
import ForumIcon from '@mui/icons-material/Forum';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@exyconn/shell/components/ui';

interface MockSiteProps {
  site: CatalogBundle;
  /** Starts a workflow in the live chat. */
  onAsk: (workflowKey: string) => void;
}

/**
 * The demo business's own website, drawn from its profile: its name, promise and what the
 * agent can do — every tile starts that conversation, the way a "Chat with us" button would.
 */
export function MockSite({ site, onAsk }: Readonly<MockSiteProps>) {
  const t = useT();
  const { business } = site.demo;
  const look = useWidgetLook(business.accent);
  const Logo = WA_ICONS[business.icon];
  const first = site.workflows[0]?.key;
  return (
    <Box sx={{ position: 'relative', bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 3,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Logo sx={{ color: look.text }} aria-hidden />
        <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {business.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
        >
          {business.phone}
        </Typography>
      </Box>
      <Box sx={{ px: 3, py: { xs: 4, md: 6 }, bgcolor: look.fill, color: look.onFill }}>
        <Typography variant="overline" component="p">
          {business.category}
        </Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700, maxWidth: 640 }}>
          {business.tagline}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, maxWidth: 640, opacity: 0.9 }}>
          {business.about}
        </Typography>
        {first && (
          <Button
            variant="contained"
            disableElevation
            startIcon={<ForumIcon />}
            onClick={() => onAsk(first)}
            sx={{ mt: 3, bgcolor: 'background.paper', color: look.text, textTransform: 'none' }}
          >
            {t('Chat with us')}
          </Button>
        )}
      </Box>
      <Box
        sx={{
          p: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {site.workflows.map((workflow) => (
          <Card key={workflow.key} variant="outlined">
            <CardActionArea onClick={() => onAsk(workflow.key)} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
                  {workflow.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {workflow.description}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: look.text, fontWeight: 600, display: 'block', mt: 1 }}
                >
                  {t('Ask the assistant →')}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
      <Box sx={{ px: 3, pb: 3, color: 'text.secondary' }}>
        <Typography variant="caption">
          {[business.address, business.hours, business.email].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
    </Box>
  );
}

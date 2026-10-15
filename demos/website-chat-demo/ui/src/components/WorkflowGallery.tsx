import { useT } from '@exyconn/i18n';
import type { CatalogBundle } from '@exyconn/bot-studio/runtime';
import { WA_ICONS } from '@exyconn/bot-studio/icons';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Card, CardContent, Chip, Typography } from '@exyconn/shell/components/ui';

interface WorkflowGalleryProps {
  sites: readonly CatalogBundle[];
  /** Opens the site and starts the workflow in the live chat. */
  onTry: (demoKey: string, workflowKey: string) => void;
}

/** Every published workflow of every demo website, grouped by site, each one a click away. */
export function WorkflowGallery({ sites, onTry }: Readonly<WorkflowGalleryProps>) {
  const t = useT();
  return (
    <Box sx={{ display: 'grid', gap: 4 }}>
      {sites.map(({ demo, workflows }) => {
        const Icon = WA_ICONS[demo.business.icon];
        return (
          <Box key={demo.key} component="section" aria-label={demo.business.name}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Icon aria-hidden />
              <Typography variant="h6" component="h3">
                {t('{industry}: {name}', { industry: demo.industry, name: demo.business.name })}
              </Typography>
              <Chip size="small" label={t('{count} workflows', { count: workflows.length })} />
            </Box>
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
              }}
            >
              {workflows.map((workflow) => (
                <Card
                  key={workflow.key}
                  component="li"
                  variant="outlined"
                  sx={{ display: 'flex', flexDirection: 'column' }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 700 }}>
                      {workflow.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {workflow.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {workflow.keywords.slice(0, 3).map((keyword) => (
                        <Chip
                          key={keyword}
                          size="small"
                          variant="outlined"
                          label={`“${keyword}”`}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => onTry(demo.key, workflow.key)}
                      aria-label={t('Try {name}', { name: workflow.name })}
                    >
                      {t('Try it')}
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

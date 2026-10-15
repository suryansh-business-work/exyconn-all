import { useT } from '@exyconn/i18n';
import { Box, Container, Link, Stack, Typography } from '@exyconn/shell/components/ui';
import { ALL_DEMOS_URL, DEMO_LINKS } from './demoLinks';
import { useDemoBranding } from './useDemoBranding';

/** The foot of every demo page: every demo, the company's site and how to reach it. */
export function DemoFooter() {
  const t = useT();
  const { websiteUrl, supportEmail, legalName } = useDemoBranding();
  const year = new Date().getFullYear();
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 4 }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('© {year} {name}. Demos run on sample data.', { year, name: legalName })}
          </Typography>
          <Stack
            component="nav"
            aria-label={t('Footer')}
            direction="row"
            spacing={2}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
          >
            <Link href={ALL_DEMOS_URL} variant="body2" color="text.secondary">
              {t('All demos')}
            </Link>
            {DEMO_LINKS.map((demo) => (
              <Link key={demo.key} href={demo.url} variant="body2" color="text.secondary">
                {t(demo.label)}
              </Link>
            ))}
            {websiteUrl && (
              <Link
                href={websiteUrl}
                variant="body2"
                color="text.secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Website')}
              </Link>
            )}
            {supportEmail && (
              <Link href={`mailto:${supportEmail}`} variant="body2" color="text.secondary">
                {supportEmail}
              </Link>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

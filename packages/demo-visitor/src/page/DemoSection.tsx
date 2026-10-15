import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Container, Typography } from '@exyconn/shell/components/ui';

interface DemoSectionProps {
  /** Labels the section for screen readers and in-page links. */
  id: string;
  title: string;
  subtitle?: string;
  /** Alternate sections sit on the panel colour so the page reads in bands. */
  tinted?: boolean;
  children: ReactNode;
}

/** One band of a demo page: a heading, an optional line under it, and its content. */
export function DemoSection({
  id,
  title,
  subtitle,
  tinted = false,
  children,
}: Readonly<DemoSectionProps>) {
  const t = useT();
  const headingId = `${id}-title`;
  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={headingId}
      sx={{ py: { xs: 5, md: 8 }, bgcolor: tinted ? 'background.paper' : 'transparent' }}
    >
      <Container maxWidth="lg">
        <Typography
          id={headingId}
          variant="h4"
          component="h2"
          sx={{ fontWeight: 'fontWeightBold', mb: 1 }}
        >
          {t(title)}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 680 }}>
            {t(subtitle)}
          </Typography>
        )}
        <Box sx={{ mt: subtitle ? 0 : 3 }}>{children}</Box>
      </Container>
    </Box>
  );
}

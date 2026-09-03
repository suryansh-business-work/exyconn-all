import { Box, Container, Flex, Link, Typography } from '@exyconn/shell/components/ui';
import { env } from '@exyconn/shell';

/** Standing footer: who runs the page and where to go for help. */
export function StatusFooter() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', mt: 6, py: 3 }}>
      <Container>
        <Flex
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Exyconn. Availability is measured from our own monitoring,
            not from a third party.
          </Typography>
          <Flex spacing={2}>
            <Link href={env.brandUrl} variant="body2" underline="hover">
              exyconn.com
            </Link>
            <Link
              href={`mailto:support@${env.portalDomain || 'exyconn.com'}`}
              variant="body2"
              underline="hover"
            >
              Contact support
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

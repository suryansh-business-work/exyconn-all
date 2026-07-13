import { Box, Flex, Heading, Text } from '@/components/ui';
import { glass } from '@/components/glass/glass';

interface BrandingPreviewProps {
  logoUrl: string;
  businessName: string;
  slogan: string;
  primaryColor: string;
}

/** Live preview of how the brand reads once saved — logo, name, slogan, accent. */
export function BrandingPreview({
  logoUrl,
  businessName,
  slogan,
  primaryColor,
}: Readonly<BrandingPreviewProps>) {
  return (
    <Box
      sx={[
        glass,
        {
          p: 2.5,
          borderLeft: '4px solid',
          borderLeftColor: primaryColor,
        },
      ]}
    >
      <Flex direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 64,
            height: 64,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            <Box
              component="img"
              src={logoUrl}
              alt={`${businessName} logo`}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Text size="sm" color="text.secondary">
              No logo
            </Text>
          )}
        </Box>
        <Box>
          <Heading level={5} sx={{ color: primaryColor, mb: 0.25 }}>
            {businessName}
          </Heading>
          <Text size="sm" color="text.secondary">
            {slogan}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

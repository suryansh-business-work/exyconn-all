import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { ColdEmailDraftFieldsFragment } from '@exyconn/shell/graphql/generated';

/**
 * What the AI made of the prospect before writing: their business in brief, from their website
 * and profile, and what of ours fits them, from our own website. Hidden on a draft written
 * before briefs until it is rewritten.
 */
export function ColdEmailBriefCard({
  draft,
}: Readonly<{ draft: Pick<ColdEmailDraftFieldsFragment, 'recordName' | 'brief'> }>) {
  const t = useT();
  const { about, fit } = draft.brief;
  if (!about && fit.length === 0) {
    return null;
  }
  return (
    <Box component="section" aria-label={t('What the AI found')} sx={panel}>
      <Stack spacing={2}>
        {about && (
          <Stack spacing={0.5}>
            <Flex direction="row" spacing={1} alignItems="center">
              <BusinessIcon fontSize="small" color="primary" />
              <Text component="h3" size="label" weight="bold" sx={{ m: 0 }}>
                {t('About {name}', { name: draft.recordName })}
              </Text>
            </Flex>
            <Text size="sm" color="text.secondary" sx={{ m: 0 }}>
              {about}
            </Text>
          </Stack>
        )}
        {fit.length > 0 && (
          <Stack spacing={0.75}>
            <Text component="h3" size="label" weight="bold" sx={{ m: 0 }}>
              {t('What we can offer them')}
            </Text>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {fit.map((line) => (
                <Flex key={line} component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
                  <Text size="sm" sx={{ m: 0 }}>
                    {line}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

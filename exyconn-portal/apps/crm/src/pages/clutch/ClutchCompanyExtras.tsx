import StarIcon from '@mui/icons-material/Star';
import { useT } from '@exyconn/i18n';
import { Box, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import type { ClutchCompanyFieldsFragment } from '@exyconn/shell/graphql/generated';

type Company = ClutchCompanyFieldsFragment;

/** "5.0 · Confidential · 2026-08-20": the line under a review's title. */
const reviewLine = (review: Company['reviews'][number]) =>
  [
    review.rating == null ? '' : review.rating.toFixed(1),
    review.projectSize,
    review.industry,
    review.date,
  ]
    .filter(Boolean)
    .join(' · ');

/** A company's reviews, portfolio and listed people, as Clutch gave them. */
export function ClutchCompanyExtras({ company }: Readonly<{ company: Company }>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={2} sx={{ mt: 2 }}>
      {company.reviews.length > 0 && (
        <Box>
          <Text weight="medium">{t('Client reviews')}</Text>
          {company.reviews.map((review) => (
            <Box key={`${review.title}-${review.date}`} sx={{ mt: 1 }}>
              <Flex direction="row" spacing={0.5} alignItems="center">
                <StarIcon fontSize="small" color="warning" />
                <Text size="sm" weight="medium">
                  {review.title || t('Review')}
                </Text>
              </Flex>
              <Text size="sm" color="text.secondary">
                {reviewLine(review)}
              </Text>
              {review.comment && (
                <Text size="sm" sx={{ whiteSpace: 'pre-line' }}>
                  {review.comment}
                </Text>
              )}
              {review.reviewer && (
                <Text size="sm" color="text.secondary">
                  — {[review.reviewer, review.reviewerTitle].filter(Boolean).join(', ')}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      )}
      {company.portfolio.length > 0 && (
        <Box>
          <Divider sx={{ mb: 1 }} />
          <Text weight="medium">{t('Portfolio')}</Text>
          {company.portfolio.map((item) => (
            <Flex key={`${item.title}-${item.imageUrl}`} direction="row" spacing={1} sx={{ mt: 1 }}>
              {item.imageUrl && (
                <Box
                  component="img"
                  src={item.imageUrl}
                  alt={item.title || t('Portfolio item')}
                  sx={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 1 }}
                />
              )}
              <Box>
                {item.title && (
                  <Text size="sm" weight="medium">
                    {item.title}
                  </Text>
                )}
                <Text size="sm">{item.description}</Text>
              </Box>
            </Flex>
          ))}
        </Box>
      )}
      {company.people.length > 0 && (
        <Box>
          <Divider sx={{ mb: 1 }} />
          <Text weight="medium">{t('People')}</Text>
          {company.people.map((person) => (
            <Text key={`${person.name}-${person.email}`} size="sm">
              {[person.name, person.title, person.email, person.phone].filter(Boolean).join(' · ')}
            </Text>
          ))}
        </Box>
      )}
    </Flex>
  );
}

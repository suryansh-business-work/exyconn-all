import StarIcon from '@mui/icons-material/Star';
import { useT } from '@exyconn/i18n';
import { Avatar, Flex, Link, Stack, Text } from '@exyconn/shell/components/ui';
import type { CompanyGoogleBusinessQuery } from '@exyconn/shell/graphql/generated';
import { initialsOf } from '../../../../records/detail';

type Review = NonNullable<CompanyGoogleBusinessQuery['companyGoogleBusiness']>['reviews'][number];

function ReviewItem({ review }: Readonly<{ review: Review }>) {
  const t = useT();
  const author = review.authorUrl ? (
    <Link
      href={review.authorUrl}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ fontWeight: 600 }}
    >
      {review.authorName}
    </Link>
  ) : (
    <Text weight="semibold">{review.authorName}</Text>
  );
  return (
    <Flex direction="row" spacing={1.5} alignItems="flex-start">
      <Avatar src={review.authorPhotoUrl || undefined} alt="" sx={{ width: 36, height: 36 }}>
        {initialsOf(review.authorName)}
      </Avatar>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Flex direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {author}
          {review.rating != null && (
            <Flex direction="row" spacing={0.5} alignItems="center">
              <StarIcon color="warning" sx={{ fontSize: 16 }} />
              <Text size="sm">{review.rating}</Text>
            </Flex>
          )}
          <Text size="sm" color="text.secondary">
            {review.relativeTime}
          </Text>
        </Flex>
        <Text size="sm" sx={{ whiteSpace: 'pre-line' }}>
          {review.text || t('No written review.')}
        </Text>
      </Stack>
    </Flex>
  );
}

/** The reviews Google shows for the place (up to five, as it picks them). */
export function GoogleReviews({ reviews }: Readonly<{ reviews: readonly Review[] }>) {
  const t = useT();
  return (
    <Stack spacing={2}>
      <Text component="h3" size="label" weight="bold">
        {t('Reviews')}
      </Text>
      {reviews.length === 0 && <Text color="text.secondary">{t('No reviews on Google yet.')}</Text>}
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </Stack>
  );
}

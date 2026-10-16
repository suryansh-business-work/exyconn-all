import { Link as RouterLink, useParams } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  ButtonBase,
  Divider,
  Flex,
  Skeleton,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { usePublicBookingPageQuery } from '@exyconn/shell/graphql/generated';
import { BookingFrame } from './BookingFrame';

/** A company's scheduling page (crm.exyconn.com/book/:org): every meeting it takes bookings for. */
export function BookingProfilePage() {
  const t = useT();
  const { org = '' } = useParams();
  const { data, loading } = usePublicBookingPageQuery({ variables: { org } });
  const page = data?.publicBookingPage;
  if (loading && !page) {
    return (
      <BookingFrame>
        <Skeleton variant="rounded" height={240} aria-busy />
      </BookingFrame>
    );
  }
  if (!page) {
    return (
      <BookingFrame>
        <Alert severity="warning">{t('This booking page does not exist.')}</Alert>
      </BookingFrame>
    );
  }
  return (
    <BookingFrame>
      <Stack spacing={1} sx={{ textAlign: 'center', mb: 3 }}>
        <Text component="h1" size="lg" weight="bold">
          {page.organizationName}
        </Text>
        <Text color="text.secondary">
          {t('Welcome to our scheduling page. Pick a meeting to see the free times.')}
        </Text>
      </Stack>
      <Divider />
      {page.meetings.length === 0 && (
        <Text sx={{ mt: 2 }}>{t('There is nothing to book right now.')}</Text>
      )}
      <Stack component="ul" divider={<Divider />} sx={{ p: 0, m: 0, listStyle: 'none' }}>
        {page.meetings.map((meeting) => (
          <li key={meeting.slug}>
            <ButtonBase
              component={RouterLink}
              to={`/book/${page.organizationSlug}/${meeting.slug}`}
              sx={{ width: '100%', textAlign: 'left', p: 2, display: 'block' }}
            >
              <Flex direction="row" spacing={1.5} alignItems="center">
                <Box
                  aria-hidden
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    flexShrink: 0,
                  }}
                />
                <Text weight="bold" sx={{ flex: 1 }}>
                  {meeting.title}
                </Text>
                <ChevronRightIcon />
              </Flex>
              <Text
                size="sm"
                color="text.secondary"
                sx={{
                  mt: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {t('{minutes} min', { minutes: meeting.durationMinutes })} · {meeting.description}
              </Text>
            </ButtonBase>
          </li>
        ))}
      </Stack>
    </BookingFrame>
  );
}

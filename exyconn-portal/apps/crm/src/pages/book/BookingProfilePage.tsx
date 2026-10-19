import { Link as RouterLink } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useT } from '@exyconn/i18n';
import { Alert, ButtonBase, Divider, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { usePublicBookingPageQuery } from '@exyconn/shell/graphql/generated';
import { BookingFrame } from './BookingFrame';
import { BookingProfileSkeleton } from './BookingSkeletons';
import { useBookingAddress } from './useBookingAddress';
import { useTrackView } from './useTrackView';

/** A company's scheduling page (/organization/:org/book/:page): every meeting it takes bookings for. */
export function BookingProfilePage() {
  const t = useT();
  const { at } = useBookingAddress();
  const { data, loading } = usePublicBookingPageQuery({ variables: at });
  const page = data?.publicBookingPage;
  useTrackView(at, '', Boolean(page));
  if (loading && !page) {
    return <BookingProfileSkeleton />;
  }
  if (!page) {
    return (
      <BookingFrame>
        <Alert severity="warning">{t('This booking page does not exist.')}</Alert>
      </BookingFrame>
    );
  }
  return (
    <BookingFrame brand={page}>
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
        <Text component="p" sx={{ mt: 2 }}>
          {t('There is nothing to book right now.')}
        </Text>
      )}
      <Stack component="ul" divider={<Divider />} sx={{ p: 0, m: 0, listStyle: 'none' }}>
        {page.meetings.map((meeting) => (
          <li key={meeting.slug}>
            <ButtonBase
              component={RouterLink}
              to={`/book/${at.page}/${meeting.slug}`}
              sx={{
                width: '100%',
                textAlign: 'left',
                p: 2,
                display: 'block',
                borderLeft: 4,
                borderLeftColor: 'transparent',
                '&:hover, &:focus-visible': {
                  bgcolor: 'action.hover',
                  borderLeftColor: 'primary.main',
                },
              }}
            >
              <Flex direction="row" spacing={1.5} alignItems="center">
                <Text weight="bold" sx={{ flex: 1 }}>
                  {meeting.title}
                </Text>
                <ChevronRightIcon color="primary" />
              </Flex>
              <Flex direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Text size="sm" color="text.secondary">
                  {t('{minutes} min', { minutes: meeting.durationMinutes })}
                </Text>
              </Flex>
              {meeting.description && (
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
                  {meeting.description}
                </Text>
              )}
            </ButtonBase>
          </li>
        ))}
      </Stack>
    </BookingFrame>
  );
}

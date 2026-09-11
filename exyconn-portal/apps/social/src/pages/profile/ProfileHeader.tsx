import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  fontSize,
} from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { SocialProfileQuery } from '@exyconn/shell/graphql/generated';

type Profile = SocialProfileQuery['socialProfile'];

interface ProfileHeaderProps {
  profile: Profile;
}

/** A stat is only worth a chip once it has happened. */
function stats(profile: Profile): Array<{ key: string; label: string }> {
  return [
    { key: 'posts', label: `${profile.postCount} posts` },
    { key: 'likes', label: `${profile.likesReceived} likes received` },
  ];
}

/**
 * Who a colleague is: their picture, their role, when they joined and what the feed has
 * seen of them. The directory record and the feed record on one card, because looking
 * somebody up is exactly when you want both.
 */
export function ProfileHeader({ profile }: Readonly<ProfileHeaderProps>) {
  const { formatDate } = useSettings();
  const { user } = profile;
  const role = [user.designation, user.department].filter(Boolean).join(' · ');

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{
            alignItems: 'center',
          }}
        >
          <Avatar
            src={user.avatarUrl ?? undefined}
            alt={user.name}
            sx={{ width: 96, height: 96, fontSize: fontSize['4xl'] }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, minWidth: 0 }}>
            <Typography variant="h5">{user.name}</Typography>
            {role && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {role}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              {user.email}
            </Typography>
            {profile.joinDate && (
              <Typography
                variant="caption"
                component="div"
                sx={{
                  color: 'text.secondary',
                  mt: 0.5,
                }}
              >
                Joined {formatDate(profile.joinDate)}
              </Typography>
            )}
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}
            >
              {stats(profile).map((stat) => (
                <Chip key={stat.key} size="small" label={stat.label} />
              ))}
            </Stack>
          </Box>
        </Stack>

        {profile.brief && (
          <Typography variant="body2" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>
            {profile.brief}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

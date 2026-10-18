import type { ReactNode } from 'react';
import { Flex, Stack, Text } from '@exyconn/shell/components/ui';

interface ProfileHeaderProps {
  /** The logo or picture, top left. */
  avatar: ReactNode;
  name: string;
  /** `h1` on the record's own page, `h2` inside a panel that sits on another page. */
  titleComponent?: 'h1' | 'h2';
  titleId?: string;
  /** A line under the name: the domain, or the job title and company. */
  subtitle?: ReactNode;
  /** Status chips, on their own line. */
  chips: ReactNode;
  /** Controls aligned top right, beside the avatar (e.g. Edit), so the name keeps the full width. */
  action?: ReactNode;
}

/** The top of a record's profile: avatar and actions on one row, then the name across the width. */
export function ProfileHeader({
  avatar,
  name,
  titleComponent = 'h1',
  titleId,
  subtitle,
  chips,
  action,
}: Readonly<ProfileHeaderProps>) {
  return (
    <Stack spacing={1.5}>
      <Flex direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        {avatar}
        {action}
      </Flex>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Text
          component={titleComponent}
          id={titleId}
          size="lg"
          weight="bold"
          sx={{ m: 0, overflowWrap: 'anywhere' }}
        >
          {name}
        </Text>
        {subtitle}
      </Stack>
      <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {chips}
      </Flex>
    </Stack>
  );
}

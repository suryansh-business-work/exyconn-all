import type { ReactNode } from 'react';
import StarIcon from '@mui/icons-material/Star';
import { useT } from '@exyconn/i18n';
import { Flex, Link, Text } from '@exyconn/shell/components/ui';

interface Point {
  value: string;
  label: string;
  primary: boolean;
}

/** Every address or number, the primary first, each a link that opens mail or the dialler. */
export function ContactPointList({
  points,
  scheme,
  trailing,
}: Readonly<{
  points: Point[];
  scheme: 'mailto' | 'tel';
  /** Extra controls after one entry, e.g. the Verify button beside an email address. */
  trailing?: (value: string) => ReactNode;
}>) {
  const t = useT();
  const ordered = [...points].sort((a, b) => Number(b.primary) - Number(a.primary));
  return (
    <Flex direction="column" spacing={0.5}>
      {ordered.map((point) => (
        <Flex
          key={point.value}
          direction="row"
          spacing={0.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Link href={`${scheme}:${point.value}`} underline="hover">
            {point.value}
          </Link>
          <Text size="caption" color="text.secondary">
            {t(point.label)}
          </Text>
          {point.primary && (
            <StarIcon fontSize="inherit" color="warning" titleAccess={t('Primary')} />
          )}
          {trailing?.(point.value)}
        </Flex>
      ))}
    </Flex>
  );
}

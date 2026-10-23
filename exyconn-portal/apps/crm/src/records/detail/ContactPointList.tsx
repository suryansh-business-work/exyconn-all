import type { ReactNode } from 'react';
import StarIcon from '@mui/icons-material/Star';
import { useT } from '@exyconn/i18n';
import { Flex, Link, Text } from '@exyconn/shell/components/ui';

interface Point {
  value: string;
  label: string;
  primary: boolean;
}

/**
 * Every address or number, the primary first, each a link that opens mail or the dialler —
 * or, given `onSelect`, a button the app handles itself.
 */
export function ContactPointList({
  points,
  scheme,
  renderTrailing,
  onSelect,
}: Readonly<{
  points: Point[];
  scheme: 'mailto' | 'tel';
  /** Extra controls after one entry, e.g. the Verify button beside an email address. */
  renderTrailing?: (value: string) => ReactNode;
  /** Handles a click in the app (e.g. the CRM's email window) instead of following the link. */
  onSelect?: (value: string) => void;
}>) {
  const t = useT();
  const ordered = [...points].sort((a, b) => Number(b.primary) - Number(a.primary));
  return (
    <Flex direction="column" spacing={0.5}>
      {ordered.map((point) => (
        <Flex
          key={point.value}
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          {onSelect ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => onSelect(point.value)}
            >
              {point.value}
            </Link>
          ) : (
            <Link href={`${scheme}:${point.value}`} underline="hover">
              {point.value}
            </Link>
          )}
          <Text size="caption" color="text.secondary">
            {t(point.label)}
          </Text>
          {point.primary && (
            <StarIcon fontSize="inherit" color="warning" titleAccess={t('Primary')} />
          )}
          {renderTrailing?.(point.value)}
        </Flex>
      ))}
    </Flex>
  );
}

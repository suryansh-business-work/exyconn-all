import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';

interface DetailFieldProps {
  label: string;
  children: ReactNode;
  /**
   * What to say when there is no value, e.g. "No email". Without it an empty field renders
   * nothing at all (custom properties, which only show what was filled in).
   */
  empty?: string;
}

const isEmpty = (value: ReactNode) =>
  value === '' || value === null || value === undefined || value === false;

/** One labelled fact on a profile: the label as a caption, the value under it at body size. */
export function DetailField({ label, children, empty }: Readonly<DetailFieldProps>) {
  const t = useT();
  const blank = isEmpty(children);
  if (blank && !empty) {
    return null;
  }
  return (
    <Box>
      <Text size="caption" color="text.secondary" component="div">
        {t(label)}
      </Text>
      <Text
        size="sm"
        component="div"
        color={blank ? 'text.secondary' : undefined}
        sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
      >
        {blank && empty ? t(empty) : children}
      </Text>
    </Box>
  );
}

import type { ReactNode } from 'react';
import { Stack, Text } from '@exyconn/shell/components/ui';

interface ReviewSectionProps {
  title: string;
  children: ReactNode;
}

/** One group of the import review: a heading and the businesses in it. */
export function ReviewSection({ title, children }: Readonly<ReviewSectionProps>) {
  return (
    <Stack component="section" spacing={0.5}>
      <Text component="h3" size="label" weight="bold">
        {title}
      </Text>
      {children}
    </Stack>
  );
}

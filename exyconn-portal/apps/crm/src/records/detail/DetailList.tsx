import type { ReactNode } from 'react';
import { Stack } from '@exyconn/shell/components/ui';

/** A profile's facts, one under the other with the same rhythm between each. */
export function DetailList({ children }: Readonly<{ children: ReactNode }>) {
  return <Stack spacing={1.5}>{children}</Stack>;
}

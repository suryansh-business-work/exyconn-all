import type { ReactNode } from 'react';
import { YStack } from 'tamagui';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  title: string;
  /** Whose setting this is and what it decides — every card on the screen says it. */
  description?: string;
  children: ReactNode;
}

/** One panel of the settings screen: a heading, the one line explaining it, then its content. */
export function SettingsCard({ title, description, children }: Readonly<Props>) {
  return (
    <Surface>
      <YStack gap="$1">
        <Heading>{title}</Heading>
        {description === undefined ? null : <Caption>{description}</Caption>}
      </YStack>
      {children}
    </Surface>
  );
}

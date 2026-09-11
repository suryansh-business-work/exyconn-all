import { YStack } from 'tamagui';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  title: string;
  /** What the numbers below it ARE — the heading alone does not say whether they reset. */
  caption: string;
}

/** The label over each block of numbers on the dashboard. */
export function SectionHeading({ title, caption }: Readonly<Props>) {
  return (
    <YStack gap="$1">
      <Heading>{title}</Heading>
      <Caption>{caption}</Caption>
    </YStack>
  );
}

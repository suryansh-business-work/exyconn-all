import { useId, type ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Card, CardContent, Flex, Heading, Text } from '@exyconn/shell/components/ui';

interface BuilderSectionProps {
  title: string;
  hint?: string;
  /** Sits on the heading's right — a badge or a small control. */
  aside?: ReactNode;
  children: ReactNode;
}

/** One titled panel of the audience builder, labelled for screen readers by its heading. */
export function BuilderSection({ title, hint, aside, children }: Readonly<BuilderSectionProps>) {
  const t = useT();
  const headingId = useId();
  return (
    <Card component="section" aria-labelledby={headingId} variant="outlined">
      <CardContent>
        <Flex direction="column" spacing={1.5}>
          <Flex direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Heading level={3} id={headingId} sx={{ fontSize: 'h6.fontSize' }}>
              {t(title)}
            </Heading>
            {aside}
          </Flex>
          {hint && (
            <Text size="sm" color="text.secondary">
              {t(hint)}
            </Text>
          )}
          {children}
        </Flex>
      </CardContent>
    </Card>
  );
}

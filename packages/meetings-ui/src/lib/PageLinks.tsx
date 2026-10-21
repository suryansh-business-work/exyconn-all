import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';

/** One "go there next" button. */
export interface PageLink {
  label: string;
  to: string;
}

/** A row of outlined buttons leading to the other Meeting Assistant screens. */
export function PageLinks({ links }: Readonly<{ links: readonly PageLink[] }>) {
  const t = useT();
  return (
    <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      {links.map((link) => (
        <Button key={link.to} component={RouterLink} to={link.to} variant="outlined" size="small">
          {t(link.label)}
        </Button>
      ))}
    </Flex>
  );
}

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

interface Props {
  html: string;
}

/**
 * Renders the disclosure authored by a portal ADMIN. The HTML is first-party
 * (workspace admin, not end-user input), which is why injecting it is acceptable here.
 * Scrolls inside its own panel so the agree/decline buttons always stay reachable.
 */
export default function ConsentBody({ html }: Readonly<Props>): JSX.Element {
  return (
    <Box
      sx={(theme) => ({
        maxHeight: '42vh',
        overflow: 'auto',
        p: 2,
        borderRadius: '4px',
        backgroundColor: alpha(theme.palette.text.primary, 0.04),
        border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
        color: theme.palette.text.primary,
        fontSize: 14,
        lineHeight: 1.6,
        '& > :first-of-type': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& h1': { ...theme.typography.h6, mt: 2, mb: 1 },
        '& h2': { ...theme.typography.subtitle1, fontWeight: 700, mt: 2, mb: 1 },
        '& h3, & h4': { ...theme.typography.subtitle2, mt: 1.5, mb: 0.75 },
        '& p': { my: 1 },
        '& ul, & ol': { pl: 3, my: 1 },
        '& li': { mb: 0.5 },
        '& strong, & b': { fontWeight: 700 },
        '& a': { color: theme.palette.primary.main },
        '& hr': {
          border: 'none',
          borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
          my: 2,
        },
      })}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

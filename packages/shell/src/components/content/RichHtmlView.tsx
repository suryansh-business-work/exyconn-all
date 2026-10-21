import { borderWidth, Box, radius } from '@/components/ui';
import { sanitizeRichHtml } from '@/utils/sanitizeHtml';

interface Props {
  /** Rich-text HTML written in the portal; sanitised here before it is shown. */
  html: string;
  /** Names the scrollable region for a screen reader. */
  label: string;
}

/**
 * Shows text written in the portal's rich-text editor. It scrolls, so it is focusable and
 * named (SC 2.1.1), and its links are underlined, not only coloured (SC 1.4.1).
 */
export function RichHtmlView({ html, label }: Readonly<Props>) {
  return (
    <Box
      role="region"
      aria-label={label}
      tabIndex={0}
      sx={(theme) => ({
        maxHeight: '60vh',
        overflow: 'auto',
        p: 2,
        border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
        borderRadius: `${radius.sm}px`,
        '& p': { my: 1 },
        '& ul, & ol': { pl: 3 },
        '& a': { color: theme.palette.primary.main, textDecoration: 'underline' },
      })}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
    />
  );
}

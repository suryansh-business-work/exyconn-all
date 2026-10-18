import { Link } from '@exyconn/shell/components/ui';

/** An outside link on one line, cut with an ellipsis; the full address shows on hover. */
export function TruncatedLink({ href, text }: Readonly<{ href: string; text: string }>) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={text}
      underline="hover"
      sx={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        typography: 'body2',
      }}
    >
      {text}
    </Link>
  );
}

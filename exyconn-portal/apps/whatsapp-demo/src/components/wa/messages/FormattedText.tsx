import { Box } from '@exyconn/shell/components/ui';

/** WhatsApp's own markup: *bold*, _italic_, ~strike~. */
const MARKUP = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

const STYLE: Readonly<Record<string, object>> = {
  '*': { fontWeight: 600 },
  _: { fontStyle: 'italic' },
  '~': { textDecoration: 'line-through' },
};

interface Piece {
  key: string;
  text: string;
  mark?: string;
}

function pieces(text: string): Piece[] {
  const out: Piece[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKUP)) {
    const start = match.index;
    if (start > last) {
      out.push({ key: `t${last}`, text: text.slice(last, start) });
    }
    out.push({ key: `m${start}`, text: match[0].slice(1, -1), mark: match[0][0] });
    last = start + match[0].length;
  }
  if (last < text.length) {
    out.push({ key: `t${last}`, text: text.slice(last) });
  }
  return out;
}

/** Message text with line breaks kept and WhatsApp markup applied. */
export function FormattedText({ text }: Readonly<{ text: string }>) {
  return (
    <>
      {pieces(text).map((p) =>
        p.mark ? (
          <Box component="span" key={p.key} sx={STYLE[p.mark]}>
            {p.text}
          </Box>
        ) : (
          <Box component="span" key={p.key}>
            {p.text}
          </Box>
        ),
      )}
    </>
  );
}

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { isSafeUrl } from "../../lib/files";
import { strings } from "../../strings";
import type { ChatAttachment } from "../../types";

const mediaSx = { display: "block", maxWidth: "100%", borderRadius: "12px" } as const;

function Attachment({ file }: Readonly<{ file: ChatAttachment }>) {
  if (file.kind === "VIDEO") {
    return (
      <Box
        component="video"
        src={file.url}
        controls
        preload="metadata"
        aria-label={file.name}
        sx={mediaSx}
      />
    );
  }
  if (file.kind === "AUDIO") {
    return (
      <Box
        component="audio"
        src={file.url}
        controls
        preload="metadata"
        aria-label={file.name}
        sx={{ width: 240, maxWidth: "100%" }}
      />
    );
  }
  // A preview being sent is a data: URL, which browsers refuse to open in a new tab.
  const image = (
    <Box
      component="img"
      src={file.url}
      alt={file.name}
      loading="lazy"
      sx={{ ...mediaSx, maxHeight: 220 }}
    />
  );
  if (file.url.startsWith("data:")) {
    return image;
  }
  return (
    <Link
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={strings.openAttachment(file.name)}
    >
      {image}
    </Link>
  );
}

/** Pictures (open full size in a new tab), clips and voice notes, inline in a bubble. */
export function Attachments({ files }: Readonly<{ files: readonly ChatAttachment[] }>) {
  const safe = files.filter((file) => isSafeUrl(file.url));
  if (safe.length === 0) {
    return null;
  }
  return (
    <Box sx={{ display: "grid", gap: 0.75, mt: 0.5 }}>
      {safe.map((file) => (
        <Attachment key={file.url} file={file} />
      ))}
    </Box>
  );
}

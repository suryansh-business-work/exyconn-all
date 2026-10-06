import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import type { PickedFile } from "../../hooks/useAttachments";
import { strings } from "../../strings";

interface AttachmentPreviewsProps {
  files: readonly PickedFile[];
  onRemove: (id: string) => void;
}

const THUMB = 56;

/** Thumbnails of what will be sent, each with a remove button. */
export function AttachmentPreviews({ files, onRemove }: Readonly<AttachmentPreviewsProps>) {
  if (files.length === 0) {
    return null;
  }
  return (
    <Box
      component="ul"
      sx={{ display: "flex", gap: 1, m: 0, p: 0, pb: 1, listStyle: "none", overflowX: "auto" }}
    >
      {files.map((file) => (
        <Box component="li" key={file.id} sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: THUMB,
              height: THUMB,
              borderRadius: 1.5,
              overflow: "hidden",
              border: 1,
              borderColor: "divider",
              display: "grid",
              placeItems: "center",
              bgcolor: "chat.bubble",
            }}
          >
            {file.data.startsWith("data:image/") ? (
              <Box
                component="img"
                src={file.data}
                alt={file.name}
                sx={{ width: 1, height: 1, objectFit: "cover" }}
              />
            ) : (
              <MovieRoundedIcon aria-label={file.name} />
            )}
          </Box>
          <IconButton
            size="small"
            aria-label={strings.removeFile(file.name)}
            onClick={() => onRemove(file.id)}
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}

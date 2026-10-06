import Avatar from "@mui/material/Avatar";
import { useBrandMark } from "../lib/brand";

interface BrandAvatarProps {
  size: number;
  /** On the header band the mark sits on a translucent chip rather than the night fill. */
  onBand?: boolean;
}

/** The Exyconn mark in a rounded tile: the header, the bot's messages and the welcome screens. */
export function BrandAvatar({ size, onBand = false }: Readonly<BrandAvatarProps>) {
  const mark = useBrandMark();
  return (
    <Avatar
      aria-hidden
      variant="rounded"
      src={mark}
      alt=""
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.3)}px`,
        bgcolor: onBand ? "chat.headerChip" : "chat.header",
        backgroundImage: onBand ? "none" : "var(--mui-palette-chat-headerBg)",
        border: 1,
        borderColor: onBand ? "chat.headerChip" : "transparent",
        "& img": { width: "66%", height: "66%", objectFit: "contain" },
      }}
    />
  );
}

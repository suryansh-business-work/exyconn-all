import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { eyebrow } from "../sx";

/** "Today", "Yesterday" or the date, between days of a thread — in the site's eyebrow style. */
export function DaySeparator({ label }: Readonly<{ label: string }>) {
  return (
    <Divider role="presentation" sx={{ my: 2, "&::before, &::after": { borderColor: "divider" } }}>
      <Typography component="span" sx={eyebrow}>
        {label}
      </Typography>
    </Divider>
  );
}

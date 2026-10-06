import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import { strings } from "../../strings";
import { chatRadius } from "../../theme";

const blink = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
`;

const DOTS = ["a", "b", "c"];

/** "Ana is typing" as three bouncing dots in a bubble (still dots with reduced motion). */
export function TypingIndicator({ name }: Readonly<{ name: string }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, pl: 4.5 }}>
      <Box
        aria-hidden
        sx={{
          display: "inline-flex",
          gap: 0.5,
          px: 1.5,
          py: 1.25,
          bgcolor: "chat.bubble",
          border: 1,
          borderColor: "chat.edge",
          borderRadius: chatRadius.bubble,
        }}
      >
        {DOTS.map((dot, index) => (
          <Box
            key={dot}
            component="span"
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "text.secondary",
              animation: `${blink} 1.2s ${index * 0.15}s infinite ease-in-out`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {strings.typing(name)}
      </Typography>
    </Box>
  );
}

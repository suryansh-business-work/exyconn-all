import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { strings } from "../../strings";
import type { WidgetConfig } from "../../types";
import { BrandAvatar } from "../BrandAvatar";
import { eyebrow } from "../sx";

/** How many FAQ questions the Knowledge Bot offers as starters. */
const STARTERS = 3;

interface WelcomeProps {
  title: string;
  text?: string;
  children?: ReactNode;
}

/** The brand mark, a heading and a line of copy: the top of every empty thread. */
function Welcome({ title, text, children }: Readonly<WelcomeProps>) {
  return (
    <Box sx={{ pt: 3, pb: 2, textAlign: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1.75 }}>
        <BrandAvatar size={56} />
      </Box>
      <Typography
        component="h2"
        sx={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.25 }}
      >
        {title}
      </Typography>
      {text && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 0.75, mx: "auto", maxWidth: 320, lineHeight: 1.55 }}
        >
          {text}
        </Typography>
      )}
      {children}
    </Box>
  );
}

interface KnowledgeIntroProps {
  config: WidgetConfig | null;
  onAsk: (text: string) => void;
  onTalkToPerson: () => void;
}

/** The Knowledge Bot before the first question: what it does and a few questions to try. */
export function KnowledgeIntro({ config, onAsk, onTalkToPerson }: Readonly<KnowledgeIntroProps>) {
  const starters = (config?.faqs ?? []).slice(0, STARTERS);
  return (
    <Welcome
      title={strings.knowledgeIntroTitle(config?.botName ?? strings.tabKnowledge)}
      text={strings.knowledgeIntro}
    >
      {starters.length > 0 && (
        <Box role="group" aria-label={strings.tryAsking} sx={{ mt: 3, textAlign: "left" }}>
          <Typography component="p" sx={{ ...eyebrow, mb: 1 }}>
            {strings.tryAsking}
          </Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {starters.map((faq) => (
              <Button
                key={faq.id}
                variant="outlined"
                fullWidth
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => onAsk(faq.question)}
                sx={starterSx}
              >
                {faq.question}
              </Button>
            ))}
          </Box>
        </Box>
      )}
      <Button
        startIcon={<SupportAgentRoundedIcon />}
        onClick={onTalkToPerson}
        sx={{ mt: 2, color: "text.secondary" }}
      >
        {strings.talkToPerson}
      </Button>
    </Welcome>
  );
}

/** "Chat with us" before the first message: the team's welcome. */
export function LiveIntro({ config }: Readonly<{ config: WidgetConfig | null }>) {
  return <Welcome title={strings.liveIntroTitle} text={config?.welcomeMessage || undefined} />;
}

const starterSx = {
  justifyContent: "space-between",
  textAlign: "left",
  py: 1.1,
  px: 1.75,
  fontWeight: 500,
  "& .MuiButton-endIcon": { color: "chat.onAgent", transition: "transform 0.15s" },
  "&:hover .MuiButton-endIcon": { transform: "translateX(2px)" },
  "@media (prefers-reduced-motion: reduce)": {
    "&:hover .MuiButton-endIcon": { transform: "none" },
  },
} as const;

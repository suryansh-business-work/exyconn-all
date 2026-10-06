import { useId, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { Tab } from "../../state/state";
import { strings } from "../../strings";
import type { FaqItem } from "../../types";

interface FaqSectionProps {
  faqs: readonly FaqItem[];
  onTab: (tab: Tab) => void;
}

function matches(faq: Readonly<FaqItem>, query: string): boolean {
  const text = `${faq.question} ${faq.answer}`.toLowerCase();
  return query
    .toLowerCase()
    .split(" ")
    .every((word) => text.includes(word));
}

/** Website > Chatbot > FAQs, searchable, with a way on to a person or the bot. No sign-in. */
export function FaqSection({ faqs, onTab }: Readonly<FaqSectionProps>) {
  const id = useId();
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const shown = trimmed ? faqs.filter((faq) => matches(faq, trimmed)) : faqs;
  let empty = "";
  if (faqs.length === 0) {
    empty = strings.noFaqs;
  } else if (shown.length === 0) {
    empty = strings.noFaqMatch;
  }

  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {faqs.length > 0 && (
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          size="small"
          fullWidth
          placeholder={strings.searchFaqs}
          slotProps={{
            htmlInput: { "aria-label": strings.searchFaqs, "aria-controls": `${id}-list` },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />
      )}
      <Box id={`${id}-list`} sx={{ display: "grid", gap: 1 }}>
        {shown.map((faq) => (
          <Accordion key={faq.id} disableGutters elevation={0} sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreRoundedIcon />}
              id={`${id}-${faq.id}-q`}
              aria-controls={`${id}-${faq.id}-a`}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.45 }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails id={`${id}-${faq.id}-a`} sx={{ pt: 0 }}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.6 }}
              >
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
      {empty && (
        <Typography
          role="status"
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "center", py: 3 }}
        >
          {empty}
        </Typography>
      )}
      <Box sx={helpSx}>
        <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700 }}>
          {strings.stillNeedHelp}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap", mt: 1 }}>
          <Button variant="contained" onClick={() => onTab("LIVE")} sx={bandSolidSx}>
            {strings.chatWithUs}
          </Button>
          <Button variant="outlined" onClick={() => onTab("KNOWLEDGE")} sx={bandOutlineSx}>
            {strings.askTheBot}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const accordionSx = {
  border: 1,
  borderColor: "chat.edge",
  borderRadius: "12px",
  overflow: "hidden",
  bgcolor: "background.paper",
  transition: "border-color 0.15s",
  "&::before": { display: "none" },
  "&.Mui-expanded": { borderColor: "text.disabled" },
  "& .MuiAccordionSummary-root": { minHeight: 52, px: 2 },
  "& .MuiAccordionDetails-root": { px: 2, pb: 2 },
} as const;

const helpSx = {
  mt: 3,
  p: 2.5,
  textAlign: "center",
  borderRadius: "16px",
  color: "chat.onHeader",
  bgcolor: "chat.header",
  backgroundImage: "var(--mui-palette-chat-headerBg)",
} as const;

/** The site's white call to action on a night band. */
const bandSolidSx = {
  bgcolor: "chat.onHeader",
  color: "chat.onLight",
  "&:hover": { bgcolor: "chat.onHeader", opacity: 0.88 },
} as const;

const bandOutlineSx = {
  color: "chat.onHeader",
  bgcolor: "transparent",
  borderColor: "chat.onHeaderMuted",
  "&:hover": { bgcolor: "chat.headerChip", borderColor: "chat.onHeader" },
} as const;

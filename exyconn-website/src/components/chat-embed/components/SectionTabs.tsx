import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import type { ReactElement } from "react";
import type { Tab as Section } from "../state/state";
import { strings } from "../strings";

interface SectionTabsProps {
  tab: Section;
  onTab: (tab: Section) => void;
  tabId: (tab: Section) => string;
  panelId: (tab: Section) => string;
}

const SECTIONS: ReadonlyArray<{ value: Section; label: string; icon: ReactElement }> = [
  { value: "LIVE", label: strings.tabLive, icon: <ForumRoundedIcon fontSize="small" /> },
  {
    value: "KNOWLEDGE",
    label: strings.tabKnowledge,
    icon: <SmartToyRoundedIcon fontSize="small" />,
  },
  { value: "FAQS", label: strings.tabFaqs, icon: <HelpOutlineRoundedIcon fontSize="small" /> },
];

/**
 * The three sections as WAI-ARIA tabs (arrow keys move between them). MUI Tabs directly: the
 * repo's @exyconn/tabber needs the portal shell, i18n and react-router, none of which this
 * iframe has; the selected tab is still kept in the URL (`useTabParam`).
 */
export function SectionTabs({ tab, onTab, tabId, panelId }: Readonly<SectionTabsProps>) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Tabs
        value={tab}
        onChange={(_event, next: Section) => onTab(next)}
        variant="fullWidth"
        aria-label={strings.tabsLabel}
        slotProps={{ indicator: { sx: indicatorSx } }}
        sx={{ minHeight: 0, p: 0.5, borderRadius: 3, bgcolor: "chat.track" }}
      >
        {SECTIONS.map((section) => (
          <Tab
            key={section.value}
            value={section.value}
            id={tabId(section.value)}
            aria-controls={panelId(section.value)}
            label={section.label}
            icon={section.icon}
            iconPosition="start"
            sx={tabSx}
          />
        ))}
      </Tabs>
    </Box>
  );
}

/** The selected tab's thumb: a raised tile that slides between the three sections. */
const indicatorSx = {
  top: 0,
  height: "100%",
  borderRadius: 2,
  bgcolor: "chat.thumb",
  boxShadow: 1,
  zIndex: 0,
} as const;

const tabSx = {
  zIndex: 1,
  minHeight: 36,
  minWidth: 0,
  px: 0.75,
  py: 0.75,
  gap: 0.5,
  borderRadius: 2,
  fontSize: "0.8125rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
  color: "text.secondary",
  transition: "color 0.15s",
  "&:hover": { color: "text.primary" },
  "&.Mui-selected": { color: "text.primary", "& .MuiTab-icon": { color: "chat.onAgent" } },
  "& .MuiTab-icon": { mr: 0, fontSize: 18 },
  "&.Mui-focusVisible": { outlineOffset: -3 },
} as const;

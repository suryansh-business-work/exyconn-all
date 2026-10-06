import { useEffect, useMemo } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider } from "@mui/material/styles";
import { ChatWidget } from "./components/ChatWidget";
import { BrandMarkContext } from "./lib/brand";
import { postToHost, referrerOrigin } from "./lib/host";
import { createChatTheme } from "./theme";
import type { ChatSite, ColorMode } from "./types";

export interface ChatAppProps {
  /** The portal's chat socket (wss://…/chat/ws); '' when the server has no portal URL set. */
  socketUrl: string;
  site: ChatSite;
  /** The host page's mode when the iframe was opened; the loader sends later changes. */
  theme: ColorMode;
  /** The site's brand mark URL, shown in the header and beside the bot's answers. */
  brandMark: string;
}

const pageStyles = {
  "html, body": { margin: 0, height: "100%", overflow: "hidden", background: "transparent" },
};

/** Tells the loader there is nothing to show, so it shrinks the iframe away. */
function NoChat() {
  useEffect(() => {
    console.warn("[chat] PUBLIC_PORTAL_GRAPHQL_URL is not set; the chat is not shown.");
    postToHost({ type: "resize", state: "hidden" }, referrerOrigin());
  }, []);
  return null;
}

/** The island /embed/chat mounts: the site's theme around the chat. */
export default function ChatApp({ socketUrl, site, theme, brandMark }: Readonly<ChatAppProps>) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const chatTheme = useMemo(() => createChatTheme(reducedMotion), [reducedMotion]);

  return (
    <ThemeProvider theme={chatTheme} defaultMode={theme} storageManager={null}>
      <GlobalStyles styles={pageStyles} />
      <BrandMarkContext.Provider value={brandMark}>
        {socketUrl ? (
          <ChatWidget socketUrl={socketUrl} site={site} reducedMotion={reducedMotion} />
        ) : (
          <NoChat />
        )}
      </BrandMarkContext.Provider>
    </ThemeProvider>
  );
}

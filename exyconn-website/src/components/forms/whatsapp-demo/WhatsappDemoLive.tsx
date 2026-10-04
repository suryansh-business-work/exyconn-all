import { demoChatsUrl } from "./demoAccessStore";
import type { DemoAccess } from "./whatsapp-demo.types";

interface WhatsappDemoLiveProps {
  access: DemoAccess;
  onSignOut: () => void;
}

/**
 * The live demo itself, running on this page: the real demo app in a phone-sized frame,
 * signed in with the visitor's pass, plus a way to open it full screen.
 */
export function WhatsappDemoLive({ access, onSignOut }: Readonly<WhatsappDemoLiveProps>) {
  const url = demoChatsUrl(access);
  const firstName = access.name.split(/\s+/)[0] ?? "";
  return (
    <div className="wa-live">
      <div className="wa-live__bar">
        <p className="text-sm text-fg-secondary">
          <span className="wa-live__dot" aria-hidden="true" />
          {firstName ? `Live demo, ${firstName} — ` : "Live demo — "}
          pick an industry and chat with the bot.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="inner-action inner-action--primary"
            href={url}
            target="_blank"
            rel="noopener"
          >
            Open full screen
          </a>
          <button type="button" className="inner-action" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
      <div className="wa-live__device">
        <iframe
          className="wa-live__frame"
          src={url}
          title="Exyconn WhatsApp automation — live demo"
          loading="lazy"
          allow="clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

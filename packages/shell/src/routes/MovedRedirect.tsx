import { useLocation } from 'react-router-dom';
import { appUrl, type PortalAppKey } from '../config/apps';
import { ExternalRedirect } from './ExternalRedirect';

/**
 * A page that moved to another portal app: the old address keeps working by sending the
 * browser to the same place under the new prefix, query string and hash included. A bookmark of
 * `/website/chat/sessions/42` lands on `agents.exyconn.com/agents/chat/sessions/42`.
 */
export function MovedRedirect({
  app,
  from,
  to,
}: Readonly<{ app: PortalAppKey; from: string; to: string }>) {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.startsWith(from) ? pathname.slice(from.length) : '';
  const target = appUrl(app, to + rest);
  return <ExternalRedirect to={`${target}${search}${hash}`} />;
}

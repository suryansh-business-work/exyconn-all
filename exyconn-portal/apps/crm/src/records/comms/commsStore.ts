import {
  closeDockPanel,
  dockFocusTaken,
  minimizeDockPanel,
  openDockPanel,
  restoreDockPanel,
  useDock,
  type DockPanel,
  type DockPosition,
  type DockSize,
} from '@exyconn/shell/components/compose-dock';
import { CHANNELS } from './channels';
import { CrmCommsBody, toCommsPanel } from './panels/CrmCommsBody';

export type CommsChannel = 'CALL' | 'SMS' | 'EMAIL';
export type CommsObject = 'CONTACT' | 'COMPANY';
export type { DockPosition, DockSize };
export {
  maximizeDock,
  moveDock,
  readMemory,
  resizeDock,
  useRemembered,
  writeMemory,
} from '@exyconn/shell/components/compose-dock';

/** A cold email version on its way out: its text, and the version the send is tracked against. */
export interface ColdEmailSend {
  draftId: string;
  variantId: string;
  subject: string;
  body: string;
}

/** What a page hands the dock: the channel, and the record with every number and address. */
export interface CommsRequest {
  channel: CommsChannel;
  object: CommsObject;
  id: string;
  name: string;
  phones: string[];
  emails: string[];
  /** Set when the email is a cold email version, so sending it marks that version sent. */
  coldEmail?: ColdEmailSend;
}

/** One CRM panel in the shell's dock: the request, with the dock's key and state. */
export interface CommsPanel extends CommsRequest {
  key: string;
  minimized: boolean;
  focusPending: boolean;
}

/** The CRM's view of a dock window, or null when the window is not one of the CRM's. */
export const commsPanelOf = (panel: DockPanel): CommsPanel | null =>
  panel.Body === CrmCommsBody ? toCommsPanel(panel) : null;

/**
 * The CRM's panels in the shell's dock (which also holds other windows, e.g. a personal email)
 * and where the expanded one sits.
 */
export function useCommsDock() {
  const { panels, position, size, maximized } = useDock();
  return {
    panels: panels.flatMap((panel) => commsPanelOf(panel) ?? []),
    position,
    size,
    maximized,
  };
}

/** One panel per record and channel; each cold email version gets its own, with its own draft. */
const keyOf = (request: CommsRequest) =>
  [request.channel, request.object, request.id, request.coldEmail?.variantId]
    .filter(Boolean)
    .join(':');

/** Opens (or brings back) a panel for the record in the dock; any other window becomes a pill. */
export function openComms(request: CommsRequest) {
  openDockPanel({
    key: keyOf(request),
    title: CHANNELS[request.channel].label,
    subject: request.name,
    icon: CHANNELS[request.channel].icon,
    Body: CrmCommsBody,
    data: request,
  });
}

/** The record's email panel, addressed to `address` (the one clicked) rather than its first. */
export function composeEmailTo(record: Omit<CommsRequest, 'channel'>, address: string) {
  const others = record.emails.filter((email) => email !== address);
  openComms({ ...record, channel: 'EMAIL', emails: [address, ...others] });
}

export const minimizeComms = minimizeDockPanel;
export const restoreComms = restoreDockPanel;
export const focusTaken = dockFocusTaken;
export const closeComms = closeDockPanel;

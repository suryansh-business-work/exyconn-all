/**
 * `@exyconn/bot-studio/widget` — the website chat widget on the shared bot runtime: the live
 * chat a site's visitors use, and the in-memory preview the bot studio plays drafts in.
 */
export { ChatWidget } from './ChatWidget';
export { WidgetPreview } from './WidgetPreview';
export { useLiveWidgetChat, usePreviewWidgetChat, type WidgetChat } from './useWidgetChat';
export { useWidgetLook, type WidgetLook } from './widget.look';
export { WIDGET_PLATFORMS } from './platforms';

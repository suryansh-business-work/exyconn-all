/** One message of the WhatsApp chatbot page's phone preview (CMS "service.whatsapp-demo"). */
export interface PreviewMessage {
  id: string;
  from: "bot" | "customer";
  text: string;
  /** Reply buttons under a bot message, as WhatsApp shows them (none: an empty list). */
  buttons: readonly string[];
}

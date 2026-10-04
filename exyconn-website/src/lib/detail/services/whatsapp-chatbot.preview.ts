/**
 * The conversation the WhatsApp chatbot page plays in its phone preview: a clinic booking,
 * the journey prospects ask about most. The live demo below it runs the real bots.
 */
export interface PreviewMessage {
  id: string;
  from: "bot" | "customer";
  text: string;
  /** Reply buttons under a bot message, as WhatsApp shows them. */
  buttons?: readonly string[];
}

export const WHATSAPP_PREVIEW = {
  business: "Smile Dental Clinic",
  status: "online",
  caption: "A real booking flow, start to finish, in under a minute.",
  messages: [
    {
      id: "greet",
      from: "bot",
      text: "Hi Priya! Welcome to Smile Dental. How can we help today?",
      buttons: ["Book appointment", "Clinic timings", "Talk to us"],
    },
    { id: "pick", from: "customer", text: "Book appointment" },
    {
      id: "day",
      from: "bot",
      text: "Sure. Which day suits you?",
      buttons: ["Tomorrow", "Thursday", "Friday"],
    },
    { id: "when", from: "customer", text: "Tomorrow evening" },
    {
      id: "slot",
      from: "bot",
      text: "6:30 PM with Dr. Mehta is free. Shall I book it?",
      buttons: ["Confirm", "Other time"],
    },
    { id: "yes", from: "customer", text: "Confirm" },
    {
      id: "done",
      from: "bot",
      text: "Booked! You will get a reminder two hours before. See you tomorrow.",
    },
  ] satisfies readonly PreviewMessage[],
} as const;

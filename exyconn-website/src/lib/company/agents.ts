/** Content of /order-agents — the five agents the page has always offered, and its words. */
export const agentsMeta = {
  title: "Order AI Agents | Exyconn",
  description:
    "Order AI agents for your business. Select from a list of automation agents and add them to your order list.",
  keywords: "order, AI agents, Exyconn, automation, business",
  image:
    "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&w=1200&q=80",
};

export interface Agent {
  id: string;
  name: string;
  description: string;
}

export const AGENTS: readonly Agent[] = [
  {
    id: "sales-automation",
    name: "Sales Automation Agent",
    description: "Automate your sales pipeline and follow-ups with advanced AI workflows.",
  },
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Deliver 24/7 AI-powered customer support with seamless handoff to humans.",
  },
  {
    id: "data-entry",
    name: "Data Entry Agent",
    description: "Eliminate repetitive data entry with intelligent extraction and validation.",
  },
  {
    id: "marketing-automation",
    name: "Marketing Automation Agent",
    description: "Boost campaigns and lead generation with adaptive AI strategies.",
  },
  {
    id: "hr-onboarding",
    name: "HR Onboarding Agent",
    description: "Accelerate onboarding and HR tasks with smooth, automated AI processes.",
  },
];

export const agentsBand = {
  title: "Build your AI agent suite",
  lede: "Select from our professional, production-ready AI agents and create a custom automation toolkit for your business.",
};

export const agentsText = {
  available: "Available AI agents",
  suite: "Your AI suite",
  add: "Add to suite",
  added: "Added",
  remove: "Remove",
  empty: "No agents added yet.",
  count: "{count} of {total} selected",
  detailsTitle: "Your details",
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  company: "Company name",
  notes: "Anything else we should know?",
  submit: "Submit suite request",
  sending: "Sending…",
  sent: "Thank you — your suite request is with our team. We'll reply by email.",
  pickOne: "Please add at least one agent to your suite.",
};

/** The agents chosen, by name, in catalogue order — what the request says was picked. */
export const selectedAgentNames = (ids: readonly string[], agents = AGENTS): string[] =>
  agents.filter((agent) => ids.includes(agent.id)).map((agent) => agent.name);

export interface AgentRequestContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  notes: string;
}

/**
 * What /api/form-submit receives for a suite request: the contact form's fields, so the
 * portal files it like any enquiry, with the chosen agents in the message.
 */
export const agentRequest = (
  contact: AgentRequestContact,
  names: readonly string[]
): Record<string, string> => {
  const picked = `Requested agents: ${names.join(", ")}`;
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    company: contact.company,
    subject: "project",
    page: "order-agents",
    agents: names.join(", "),
    message: contact.notes.trim() ? `${picked}\n\n${contact.notes.trim()}` : picked,
  };
};

/**
 * The offer page's direct channels. The phone number is the portal's branding `contactPhone`
 * (Admin › Branding): when it is blank there is no phone line at all — never a placeholder.
 */
export interface ContactChannel {
  id: "phone" | "email";
  icon: string;
  label: string;
  value: string;
  href: string;
}

interface ChannelLabels {
  phoneLabel: string;
  emailLabel: string;
  email: string;
}

/** "+91 98765 43210" → "tel:+919876543210" (digits and a leading plus only). */
export const phoneHref = (phone: string): string => {
  const trimmed = phone.trim();
  const digits = trimmed.replaceAll(/\D/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
};

/** The channels to show: the phone only when branding has one, then the email. */
export function contactChannels(phone: string, labels: ChannelLabels): ContactChannel[] {
  const number = phone.trim();
  const email: ContactChannel = {
    id: "email",
    icon: "fa-envelope",
    label: labels.emailLabel,
    value: labels.email,
    href: `mailto:${labels.email}`,
  };
  if (number === "") {
    return [email];
  }
  return [
    {
      id: "phone",
      icon: "fa-phone",
      label: labels.phoneLabel,
      value: number,
      href: phoneHref(number),
    },
    email,
  ];
}

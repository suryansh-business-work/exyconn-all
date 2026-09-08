/** Exactly what the public subscribe card collects. Everything else is server-side. */
export interface SubscribeFormValues {
  email: string;
}

export interface SubscribeFormProps {
  /** Called once the address has been accepted, so the card can show its confirmation. */
  onSubmitted: (email: string) => void;
}

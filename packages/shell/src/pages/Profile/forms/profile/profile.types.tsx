export interface ProfileFormValues {
  name: string;
  /** IANA zone name; '' follows the workspace default. */
  timezone: string;
  /** BCP-47 tag; '' follows the workspace default. */
  locale: string;
}

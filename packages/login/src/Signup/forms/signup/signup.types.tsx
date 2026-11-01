/** The company and person a sign-up creates, before the emailed code proves the address. */
export interface SignupFormValues {
  name: string;
  email: string;
  companyName: string;
  currency: string;
  country: string;
  planId: string;
}

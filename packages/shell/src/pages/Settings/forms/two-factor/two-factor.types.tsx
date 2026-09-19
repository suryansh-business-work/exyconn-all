/** The code typed from an authenticator app while switching two-factor on. */
export interface ConfirmTwoFactorValues {
  code: string;
}

/** The password that has to be given before two-factor can be switched off. */
export interface DisableTwoFactorValues {
  password: string;
}

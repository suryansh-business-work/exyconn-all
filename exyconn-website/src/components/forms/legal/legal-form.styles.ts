import "./legal-form.css";

/**
 * The class names the legal and grievance forms share. The shared field parts (FormField,
 * CaptchaField, SubmitButton) keep their own markup; `.legal-form` restyles them from outside.
 */
export const FORM_CLASS = "legal-form inner-panel";
export const ROW_CLASS = "legal-form__row";
export const CONTROL_CLASS = "legal-form__control";
export const CAPTCHA_CLASS = "legal-form__captcha";
export const SUBMIT_CLASS = "inner-action inner-action--primary legal-form__submit";
export const FINE_PRINT_CLASS = "legal-form__fine-print";

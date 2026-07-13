import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";

// Simple captcha generator
const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return { question: `${num1} + ${num2} = ?`, answer: num1 + num2 };
};

// Validation Schema
const ContactFormSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, "Too short!")
    .max(50, "Too long!")
    .required("First name is required"),
  lastName: Yup.string()
    .min(2, "Too short!")
    .max(50, "Too long!")
    .required("Last name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  company: Yup.string().max(100, "Too long!"),
  subject: Yup.string().required("Please select a subject"),
  message: Yup.string()
    .min(10, "Message is too short!")
    .max(1000, "Message is too long!")
    .required("Message is required"),
  captcha: Yup.string().required("Please solve the captcha"),
});

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  captcha: string;
}

const inputClasses =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
const errorInputClasses =
  "w-full px-4 py-3 bg-red-50 border border-red-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all";
const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
const errorClasses = "text-red-500 text-xs mt-1";

export default function ContactFormReact() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [captcha, setCaptcha] = useState({ question: "? + ? = ?", answer: 0 });
  const [captchaError, setCaptchaError] = useState("");

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaError("");
  };

  const initialValues: FormValues = {
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "",
    message: "",
    captcha: "",
  };

  const handleSubmit = async (
    values: FormValues,
    {
      setSubmitting,
      resetForm,
    }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    // Validate captcha
    if (parseInt(values.captcha) !== captcha.answer) {
      setCaptchaError("Incorrect answer. Please try again.");
      refreshCaptcha();
      setSubmitting(false);
      return;
    }

    try {
      const { captcha: _c, ...payload } = values;
      const res = await fetch("/api/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "contact", ...payload }),
      });
      if (!res.ok) throw new Error("Send failed");
      setSubmitStatus("success");
      resetForm();
      refreshCaptcha();
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (_error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8 lg:p-10">
      {submitStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
          <i className="fa-solid fa-check-circle"></i>
          <span>Thank you! Your message has been sent successfully.</span>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <i className="fa-solid fa-exclamation-circle"></i>
          <span>Something went wrong. Please try again.</span>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={ContactFormSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClasses} htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  className={
                    errors.firstName && touched.firstName ? errorInputClasses : inputClasses
                  }
                />
                <ErrorMessage name="firstName" component="div" className={errorClasses} />
              </div>
              <div>
                <label className={labelClasses} htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  className={errors.lastName && touched.lastName ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="lastName" component="div" className={errorClasses} />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Field
                type="email"
                id="email"
                name="email"
                placeholder="john@example.com"
                className={errors.email && touched.email ? errorInputClasses : inputClasses}
              />
              <ErrorMessage name="email" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses} htmlFor="company">
                Company Name
              </label>
              <Field
                type="text"
                id="company"
                name="company"
                placeholder="Your company"
                className={inputClasses}
              />
              <ErrorMessage name="company" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses} htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </label>
              <Field
                as="select"
                id="subject"
                name="subject"
                className={errors.subject && touched.subject ? errorInputClasses : inputClasses}
              >
                <option value="" disabled>
                  Select a topic
                </option>
                <option value="general">General Inquiry</option>
                <option value="project">Project Discussion</option>
                <option value="partnership">Partnership</option>
                <option value="support">Support</option>
                <option value="other">Other</option>
              </Field>
              <ErrorMessage name="subject" component="div" className={errorClasses} />
            </div>

            <div>
              <label className={labelClasses} htmlFor="message">
                Message <span className="text-red-500">*</span>
              </label>
              <Field
                as="textarea"
                id="message"
                name="message"
                rows={4}
                placeholder="Tell us about your project..."
                className={`${errors.message && touched.message ? errorInputClasses : inputClasses} resize-none`}
              />
              <ErrorMessage name="message" component="div" className={errorClasses} />
            </div>

            {/* Captcha */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className={labelClasses}>
                Security Check <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <i className="fa-solid fa-shield-halved text-blue-500"></i>
                  <span className="font-mono font-bold text-gray-800">{captcha.question}</span>
                </div>
                <Field
                  type="text"
                  id="captcha"
                  name="captcha"
                  placeholder="Answer"
                  className={`w-24 ${(errors.captcha && touched.captcha) || captchaError ? errorInputClasses : inputClasses}`}
                />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Refresh captcha"
                >
                  <i className="fa-solid fa-rotate"></i>
                </button>
              </div>
              <ErrorMessage name="captcha" component="div" className={errorClasses} />
              {captchaError && <div className={errorClasses}>{captchaError}</div>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <i className="fa-solid fa-paper-plane"></i>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              By submitting this form, you agree to our{" "}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}

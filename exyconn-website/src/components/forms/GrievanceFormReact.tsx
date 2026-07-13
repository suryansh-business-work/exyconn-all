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
const GrievanceFormSchema = Yup.object().shape({
  name: Yup.string().min(2, "Too short!").max(100, "Too long!").required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  subject: Yup.string()
    .min(5, "Subject is too short!")
    .max(200, "Subject is too long!")
    .required("Subject is required"),
  message: Yup.string()
    .min(20, "Please provide more details about your grievance")
    .max(3000, "Message is too long!")
    .required("Grievance details are required"),
  captcha: Yup.string().required("Please solve the captcha"),
});

interface FormValues {
  name: string;
  email: string;
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

export default function GrievanceFormReact() {
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
    name: "",
    email: "",
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
        body: JSON.stringify({ formType: "grievance", ...payload }),
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
    <section className="max-w-xl mx-auto mt-12 rounded-xl p-5">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-[#0071e3] mb-6 text-center">
          Submit Your Grievance
        </h2>

        {submitStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
            <i className="fa-solid fa-check-circle"></i>
            <span>Your grievance has been submitted. We will review it and get back to you.</span>
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
          validationSchema={GrievanceFormSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-5">
              <div>
                <label className={labelClasses} htmlFor="name">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className={errors.name && touched.name ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="name" component="div" className={errorClasses} />
              </div>

              <div>
                <label className={labelClasses} htmlFor="email">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  className={errors.email && touched.email ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="email" component="div" className={errorClasses} />
              </div>

              <div>
                <label className={labelClasses} htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="Brief description of your grievance"
                  className={errors.subject && touched.subject ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="subject" component="div" className={errorClasses} />
              </div>

              <div>
                <label className={labelClasses} htmlFor="message">
                  Grievance Details <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Please provide detailed information about your grievance..."
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
                className="cursor-pointer w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Grievance
                    <i className="fa-solid fa-paper-plane"></i>
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By submitting, you agree that your grievance will be reviewed in accordance with Exyconn's
          grievance redressal policy.
        </p>
      </div>
    </section>
  );
}

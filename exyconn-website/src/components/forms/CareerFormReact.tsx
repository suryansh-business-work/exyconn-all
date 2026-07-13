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
const CareerFormSchema = Yup.object().shape({
  name: Yup.string().min(2, "Too short!").max(100, "Too long!").required("Full name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  phone: Yup.string().matches(/^[\d\s+\-()]*$/, "Invalid phone number"),
  jobId: Yup.string().required("Job ID is required"),
  message: Yup.string().max(2000, "Message is too long!"),
  captcha: Yup.string().required("Please solve the captcha"),
});

interface FormValues {
  name: string;
  email: string;
  phone: string;
  jobId: string;
  message: string;
  captcha: string;
}

const inputClasses =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
const errorInputClasses =
  "w-full px-4 py-3 bg-red-50 border border-red-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all";
const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
const errorClasses = "text-red-500 text-xs mt-1";

export default function CareerFormReact() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
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
    phone: "",
    jobId: "",
    message: "",
    captcha: "",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File size must be less than 5MB");
        setSelectedFile(null);
        return;
      }
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setFileError("Only PDF, DOC, and DOCX files are allowed");
        setSelectedFile(null);
        return;
      }
      setFileError("");
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (
    values: FormValues,
    {
      setSubmitting,
      resetForm,
    }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    if (!selectedFile) {
      setFileError("Please upload your resume");
      setSubmitting(false);
      return;
    }

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
        body: JSON.stringify({ formType: "career", ...payload, resumeName: selectedFile?.name }),
      });
      if (!res.ok) throw new Error("Send failed");
      setSubmitStatus("success");
      resetForm();
      setSelectedFile(null);
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
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto mt-20" id="apply-now-form">
      <h3 className="text-2xl font-bold text-[#0071e3] mb-6 text-center">Apply Now</h3>

      {submitStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
          <i className="fa-solid fa-check-circle"></i>
          <span>Thank you! Your application has been submitted successfully.</span>
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
        validationSchema={CareerFormSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses} htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  autoComplete="name"
                  className={errors.name && touched.name ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="name" component="div" className={errorClasses} />
              </div>
              <div>
                <label className={labelClasses} htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={errors.email && touched.email ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="email" component="div" className={errorClasses} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses} htmlFor="phone">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Field
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                  className={inputClasses}
                />
                <ErrorMessage name="phone" component="div" className={errorClasses} />
              </div>
              <div>
                <label className={labelClasses} htmlFor="jobId">
                  Position Applied For (Job ID) <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="jobId"
                  name="jobId"
                  placeholder="e.g., EXY-2024-001"
                  className={errors.jobId && touched.jobId ? errorInputClasses : inputClasses}
                />
                <ErrorMessage name="jobId" component="div" className={errorClasses} />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="resume">
                Resume <span className="text-gray-500 font-normal">(PDF, DOCX, Max 5MB)</span>
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="file"
                id="resume"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
              />
              {fileError && <div className={errorClasses}>{fileError}</div>}
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <i className="fa-solid fa-check"></i>
                  {selectedFile.name}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="message">
                Cover Letter / Message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Field
                as="textarea"
                id="message"
                name="message"
                rows={4}
                placeholder="Tell us why you'd be a great fit for this role..."
                className={`${inputClasses} resize-none`}
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
              className="cursor-pointer w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <i className="fa-solid fa-paper-plane"></i>
                </>
              )}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

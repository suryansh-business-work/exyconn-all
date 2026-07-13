import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";

const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return { question: `${num1} + ${num2} = ?`, answer: num1 + num2 };
};

const OfferFormSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "नाम बहुत छोटा है")
    .max(50, "नाम बहुत लंबा है")
    .required("नाम ज़रूरी है"),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "सही 10 अंकों का मोबाइल नंबर डालें")
    .required("फ़ोन नंबर ज़रूरी है"),
  email: Yup.string().email("सही ईमेल डालें").required("ईमेल ज़रूरी है"),
  business: Yup.string().max(100, "बहुत लंबा है"),
  plan: Yup.string().required("कोई प्लान चुनें"),
  message: Yup.string().max(500, "संदेश बहुत लंबा है"),
  captcha: Yup.string().required("कैप्चा हल करें"),
});

interface FormValues {
  name: string;
  phone: string;
  email: string;
  business: string;
  plan: string;
  message: string;
  captcha: string;
}

const inputBase =
  "w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm";
const inputNormal = `${inputBase} border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`;
const inputError = `${inputBase} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20`;
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
const errCls = "text-red-500 text-xs mt-1 flex items-center gap-1";

export default function IndiaOfferForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [captcha, setCaptcha] = useState({ question: "? + ? = ?", answer: 0 });
  const [captchaErr, setCaptchaErr] = useState("");

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaErr("");
  };

  const initialValues: FormValues = {
    name: "",
    phone: "",
    email: "",
    business: "",
    plan: "",
    message: "",
    captcha: "",
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: { setSubmitting: (v: boolean) => void; resetForm: () => void }
  ) => {
    if (parseInt(values.captcha) !== captcha.answer) {
      setCaptchaErr("गलत जवाब — दोबारा कोशिश करें");
      refreshCaptcha();
      setSubmitting(false);
      return;
    }

    try {
      const { captcha: _c, ...payload } = values;
      const res = await fetch("/api/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "india-offer", ...payload }),
      });
      if (!res.ok) throw new Error("Send failed");
      setStatus("success");
      resetForm();
      refreshCaptcha();
      setTimeout(() => setStatus("idle"), 6000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="offer-form-wrapper">
      {status === "success" && (
        <div className="form-alert form-alert-success">
          <i className="fa-solid fa-circle-check"></i>
          <span>धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।</span>
        </div>
      )}
      {status === "error" && (
        <div className="form-alert form-alert-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।</span>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={OfferFormSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="offer-form-grid" noValidate>
            {/* नाम */}
            <div className="form-field">
              <label className={labelCls} htmlFor="offer-name">
                <i className="fa-solid fa-user form-field-icon"></i> आपका नाम{" "}
                <span className="text-red-500">*</span>
              </label>
              <Field
                type="text"
                id="offer-name"
                name="name"
                placeholder="अपना पूरा नाम लिखें"
                className={errors.name && touched.name ? inputError : inputNormal}
              />
              <ErrorMessage name="name" component="div" className={errCls} />
            </div>

            {/* फ़ोन */}
            <div className="form-field">
              <label className={labelCls} htmlFor="offer-phone">
                <i className="fa-solid fa-phone form-field-icon"></i> फ़ोन नंबर{" "}
                <span className="text-red-500">*</span>
              </label>
              <Field
                type="tel"
                id="offer-phone"
                name="phone"
                placeholder="9876543210"
                maxLength={10}
                className={errors.phone && touched.phone ? inputError : inputNormal}
              />
              <ErrorMessage name="phone" component="div" className={errCls} />
            </div>

            {/* ईमेल */}
            <div className="form-field">
              <label className={labelCls} htmlFor="offer-email">
                <i className="fa-solid fa-envelope form-field-icon"></i> ईमेल{" "}
                <span className="text-red-500">*</span>
              </label>
              <Field
                type="email"
                id="offer-email"
                name="email"
                placeholder="aapka@email.com"
                className={errors.email && touched.email ? inputError : inputNormal}
              />
              <ErrorMessage name="email" component="div" className={errCls} />
            </div>

            {/* बिज़नेस / कंपनी */}
            <div className="form-field">
              <label className={labelCls} htmlFor="offer-business">
                <i className="fa-solid fa-building form-field-icon"></i> बिज़नेस का नाम
              </label>
              <Field
                type="text"
                id="offer-business"
                name="business"
                placeholder="आपकी कंपनी / दुकान का नाम"
                className={inputNormal}
              />
              <ErrorMessage name="business" component="div" className={errCls} />
            </div>

            {/* प्लान */}
            <div className="form-field form-field-full">
              <label className={labelCls} htmlFor="offer-plan">
                <i className="fa-solid fa-box-open form-field-icon"></i> कौनसा प्लान चाहिए?{" "}
                <span className="text-red-500">*</span>
              </label>
              <Field
                as="select"
                id="offer-plan"
                name="plan"
                className={errors.plan && touched.plan ? inputError : inputNormal}
              >
                <option value="" disabled>
                  — प्लान चुनें —
                </option>
                <option value="basic">Basic Biz — ₹4,999</option>
                <option value="smart">Smart Biz — ₹9,999 (लोकप्रिय)</option>
                <option value="pro">Pro Biz — ₹14,999</option>
                <option value="custom">मुझे सलाह चाहिए</option>
              </Field>
              <ErrorMessage name="plan" component="div" className={errCls} />
            </div>

            {/* संदेश */}
            <div className="form-field form-field-full">
              <label className={labelCls} htmlFor="offer-message">
                <i className="fa-solid fa-comment-dots form-field-icon"></i> कुछ और बताना है?
              </label>
              <Field
                as="textarea"
                id="offer-message"
                name="message"
                rows={3}
                placeholder="अपनी ज़रूरत यहाँ लिखें..."
                className={inputNormal}
                style={{ resize: "vertical" as const }}
              />
              <ErrorMessage name="message" component="div" className={errCls} />
            </div>

            {/* कैप्चा */}
            <div className="form-field form-field-full">
              <label className={labelCls}>
                <i className="fa-solid fa-shield-halved form-field-icon"></i> सुरक्षा जाँच{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="captcha-row">
                <span className="captcha-question">{captcha.question}</span>
                <Field
                  type="text"
                  name="captcha"
                  placeholder="जवाब"
                  className={
                    (errors.captcha && touched.captcha) || captchaErr
                      ? `${inputError} captcha-input`
                      : `${inputNormal} captcha-input`
                  }
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="captcha-refresh"
                  title="नया सवाल"
                  aria-label="कैप्चा रीफ्रेश करें"
                >
                  <i className="fa-solid fa-rotate-right"></i>
                </button>
              </div>
              {captchaErr && (
                <div className={errCls}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {captchaErr}
                </div>
              )}
              <ErrorMessage name="captcha" component="div" className={errCls} />
            </div>

            {/* सबमिट */}
            <div className="form-field form-field-full">
              <button type="submit" disabled={isSubmitting} className="submit-btn">
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> भेज रहे हैं...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> अभी भेजें
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

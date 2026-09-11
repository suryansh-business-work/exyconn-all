import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCaptchaSubmit } from "../shared";
import { offerInputClass } from "./india-offer.classes";
import { INDIA_OFFER_FORM_DEFAULTS, indiaOfferFormSchema } from "./india-offer.schema";
import type { IndiaOfferFormValues } from "./india-offer.types";
import { OfferCaptcha } from "./OfferCaptcha";
import { OfferField } from "./OfferField";
import { OfferStatusAlert } from "./OfferStatusAlert";

const CAPTCHA_OPTIONS = { incorrectAnswer: "गलत जवाब — दोबारा कोशिश करें", successResetMs: 6000 };

/** The India offer lead form (React Hook Form + Zod), validated in the browser before it sends. */
export function IndiaOfferForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IndiaOfferFormValues>({
    resolver: zodResolver(indiaOfferFormSchema),
    defaultValues: INDIA_OFFER_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "india-offer",
    () => reset(),
    CAPTCHA_OPTIONS
  );

  const onSubmit = ({ captcha: answer, ...payload }: IndiaOfferFormValues) =>
    submit(answer, payload);

  return (
    <div className="offer-form-wrapper">
      <OfferStatusAlert status={status} />

      <form className="offer-form-grid" noValidate onSubmit={handleSubmit(onSubmit)}>
        <OfferField
          id="offer-name"
          icon="fa-user"
          label="आपका नाम"
          required
          error={errors.name?.message}
        >
          <input
            type="text"
            id="offer-name"
            placeholder="अपना पूरा नाम लिखें"
            className={offerInputClass(Boolean(errors.name))}
            {...register("name")}
          />
        </OfferField>

        <OfferField
          id="offer-phone"
          icon="fa-phone"
          label="फ़ोन नंबर"
          required
          error={errors.phone?.message}
        >
          <input
            type="tel"
            id="offer-phone"
            placeholder="9876543210"
            maxLength={10}
            className={offerInputClass(Boolean(errors.phone))}
            {...register("phone")}
          />
        </OfferField>

        <OfferField
          id="offer-email"
          icon="fa-envelope"
          label="ईमेल"
          required
          error={errors.email?.message}
        >
          <input
            type="email"
            id="offer-email"
            placeholder="aapka@email.com"
            className={offerInputClass(Boolean(errors.email))}
            {...register("email")}
          />
        </OfferField>

        <OfferField
          id="offer-business"
          icon="fa-building"
          label="बिज़नेस का नाम"
          error={errors.business?.message}
        >
          <input
            type="text"
            id="offer-business"
            placeholder="आपकी कंपनी / दुकान का नाम"
            className={offerInputClass()}
            {...register("business")}
          />
        </OfferField>

        <OfferField
          id="offer-plan"
          icon="fa-box-open"
          label="कौनसा प्लान चाहिए?"
          required
          full
          error={errors.plan?.message}
        >
          <select
            id="offer-plan"
            defaultValue=""
            className={offerInputClass(Boolean(errors.plan))}
            {...register("plan")}
          >
            <option value="" disabled>
              — प्लान चुनें —
            </option>
            <option value="basic">Basic Biz — ₹4,999</option>
            <option value="smart">Smart Biz — ₹9,999 (लोकप्रिय)</option>
            <option value="pro">Pro Biz — ₹14,999</option>
            <option value="custom">मुझे सलाह चाहिए</option>
          </select>
        </OfferField>

        <OfferField
          id="offer-message"
          icon="fa-comment-dots"
          label="कुछ और बताना है?"
          full
          error={errors.message?.message}
        >
          <textarea
            id="offer-message"
            rows={3}
            placeholder="अपनी ज़रूरत यहाँ लिखें..."
            className={offerInputClass()}
            style={{ resize: "vertical" }}
            {...register("message")}
          />
        </OfferField>

        <OfferCaptcha
          question={captcha.question}
          registration={register("captcha")}
          error={errors.captcha?.message}
          captchaError={captchaError}
          onRefresh={refreshCaptcha}
        />

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
      </form>
    </div>
  );
}

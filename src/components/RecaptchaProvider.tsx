"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { forwardRef } from "react";

interface RecaptchaV2Props {
  onChange: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
}

const RecaptchaV2 = forwardRef<ReCAPTCHA, RecaptchaV2Props>(
  ({ onChange, onExpired, onError }, ref) => {
    return (
      <ReCAPTCHA
        ref={ref}
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        onChange={onChange}
        onExpired={onExpired}
        onError={onError}
      />
    );
  }
);

RecaptchaV2.displayName = "RecaptchaV2";

export default RecaptchaV2;
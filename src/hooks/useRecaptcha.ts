/**
 * React hook for Google reCAPTCHA v3 integration
 * Following GDPR and security compliance standards
 */

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

// Site key should be configured via environment variable
export const RECAPTCHA_SITE_KEY = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_RECAPTCHA_SITE_KEY ?? '')
  : '';

/**
 * Hook that provides reCAPTCHA v3 token execution.
 * Returns an empty string in environments where reCAPTCHA is unavailable.
 */
export function useRecaptcha() {
  const executeRecaptcha = async (action: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.grecaptcha || !RECAPTCHA_SITE_KEY) {
      return '';
    }

    return new Promise<string>((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
          resolve(token);
        } catch {
          resolve('');
        }
      });
    });
  };

  return { executeRecaptcha };
}

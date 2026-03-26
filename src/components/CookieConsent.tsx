// Cookie consent banner component for GDPR compliance
import React, { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'gdpr_cookie_consent';

interface CookiePreferences {
  necessary: boolean;   // Always true - cannot be opted out
  analytics: boolean;
  marketing: boolean;
}

/**
 * Cookie consent banner following GDPR requirements.
 * Stores user preferences in localStorage and exposes them globally.
 */
export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const consentRecord = {
      ...prefs,
      necessary: true, // Always required
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentRecord));
    setIsVisible(false);
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const acceptNecessaryOnly = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="cookie-consent__content">
        <h2 id="cookie-consent-title" className="cookie-consent__title">
          Cookie Preferences
        </h2>
        <p id="cookie-consent-description" className="cookie-consent__description">
          We use cookies to improve your experience. Please choose which cookies you
          allow. You can change these settings at any time. For more information, see
          our{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          .
        </p>

        {showDetails && (
          <div className="cookie-consent__details" role="group" aria-label="Cookie categories">
            <div className="cookie-consent__category">
              <label className="cookie-consent__label">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  aria-label="Necessary cookies (always enabled)"
                />
                <span>
                  <strong>Necessary</strong> — Required for the site to function.
                  Cannot be disabled.
                </span>
              </label>
            </div>
            <div className="cookie-consent__category">
              <label className="cookie-consent__label">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  aria-label="Analytics cookies"
                />
                <span>
                  <strong>Analytics</strong> — Help us understand how visitors use our
                  site (anonymised data).
                </span>
              </label>
            </div>
            <div className="cookie-consent__category">
              <label className="cookie-consent__label">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  aria-label="Marketing cookies"
                />
                <span>
                  <strong>Marketing</strong> — Allow us to provide personalised
                  content and ads.
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="cookie-consent__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={acceptAll}
          >
            Accept All
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={acceptNecessaryOnly}
          >
            Necessary Only
          </button>
          {showDetails ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={saveCustomPreferences}
            >
              Save My Preferences
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--link"
              onClick={() => setShowDetails(true)}
              aria-expanded={showDetails}
              aria-controls="cookie-details"
            >
              Customise
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

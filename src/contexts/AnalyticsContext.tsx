import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

type ConsentState = 'accepted' | 'declined' | 'pending';

interface TrackEventInput {
  entityType?: string;
  entityId?: string;
  eventValue?: number;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsContextType {
  consent: ConsentState;
  trackEvent: (eventName: string, payload?: TrackEventInput) => void;
  acceptAnalytics: () => void;
  declineAnalytics: () => void;
}

const CONSENT_KEY = 'siena_analytics_consent';
const SESSION_KEY = 'siena_session_id';
const VISITOR_COOKIE = 'siena_visitor_id';

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

const generateId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (name: string, value: string) => {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
};

const getOrCreateSessionId = () => {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const next = generateId();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
};

const getOrCreateVisitorId = () => {
  const existing = getCookie(VISITOR_COOKIE);
  if (existing) {
    return existing;
  }

  const next = generateId();
  setCookie(VISITOR_COOKIE, next);
  return next;
};

const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) {
    return 'mobile';
  }
  if (width < 1024) {
    return 'tablet';
  }
  return 'desktop';
};

const getBrowserName = () => {
  const agent = navigator.userAgent;
  if (agent.includes('Edg/')) return 'Edge';
  if (agent.includes('Chrome/')) return 'Chrome';
  if (agent.includes('Safari/') && !agent.includes('Chrome/')) return 'Safari';
  if (agent.includes('Firefox/')) return 'Firefox';
  if (agent.includes('OPR/') || agent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const getOsName = () => {
  const agent = navigator.userAgent;
  if (agent.includes('Windows')) return 'Windows';
  if (agent.includes('Mac OS')) return 'macOS';
  if (agent.includes('Android')) return 'Android';
  if (agent.includes('iPhone') || agent.includes('iPad')) return 'iOS';
  if (agent.includes('Linux')) return 'Linux';
  return 'Unknown';
};

const getUtmParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
};

const getReferrerDomain = () => {
  if (!document.referrer) {
    return null;
  }

  try {
    return new URL(document.referrer).hostname;
  } catch {
    return null;
  }
};

const getElementLabel = (element: Element) => {
  const ariaLabel = element.getAttribute('aria-label');
  const title = element.getAttribute('title');
  const text = element.textContent?.trim().replace(/\s+/g, ' ');
  return ariaLabel || title || text?.slice(0, 120) || element.tagName.toLowerCase();
};

export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const currentPagePath = `${location.pathname}${location.search}`;
  const pageStartedAtRef = useRef(Date.now());
  const trackedScrollDepthsRef = useRef<Set<number>>(new Set());
  const lastPageViewPathRef = useRef('');
  const lastCheckoutReturnPathRef = useRef('');
  const [consent, setConsent] = useState<ConsentState>(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === 'accepted' || stored === 'declined' ? stored : 'pending';
  });

  const trackEvent = useCallback(
    (eventName: string, payload: TrackEventInput = {}) => {
      if (consent !== 'accepted') {
        return;
      }

      const visitorId = getOrCreateVisitorId();
      const sessionId = getOrCreateSessionId();
      const pagePath = payload.pagePath ?? currentPagePath;
      const utm = getUtmParams(location.search);

      void supabase.from('analytics_events').insert({
        visitor_id: visitorId,
        session_id: sessionId,
        event_name: eventName,
        event_value: payload.eventValue ?? null,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
        page_path: pagePath,
        page_title: document.title,
        language: i18n.resolvedLanguage ?? i18n.language,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser_name: getBrowserName(),
        os_name: getOsName(),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        ...utm,
        metadata: {
          referrer_domain: getReferrerDomain(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          device_pixel_ratio: window.devicePixelRatio,
          url: window.location.href,
          ...payload.metadata,
        },
      });
    },
    [consent, currentPagePath, i18n.language, i18n.resolvedLanguage, location.search],
  );

  const acceptAnalytics = useCallback(() => {
    window.localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
  }, []);

  const declineAnalytics = useCallback(() => {
    window.localStorage.setItem(CONSENT_KEY, 'declined');
    deleteCookie(VISITOR_COOKIE);
    window.sessionStorage.removeItem(SESSION_KEY);
    setConsent('declined');
  }, []);

  useEffect(() => {
    const previousPath = lastPageViewPathRef.current;
    const now = Date.now();

    if (previousPath && previousPath !== currentPagePath) {
      const durationSeconds = Math.max(1, Math.round((now - pageStartedAtRef.current) / 1000));
      trackEvent('time_on_page', {
        eventValue: durationSeconds,
        pagePath: previousPath,
        metadata: { duration_seconds: durationSeconds },
      });
      trackedScrollDepthsRef.current = new Set();
      pageStartedAtRef.current = now;
    }

    if (lastPageViewPathRef.current !== currentPagePath) {
      lastPageViewPathRef.current = currentPagePath;
      trackEvent('page_view', {
        pagePath: currentPagePath,
        metadata: {
          page_title: document.title,
        },
      });
    }
  }, [currentPagePath, trackEvent]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkoutStatus = params.get('checkout');

    if (!checkoutStatus || lastCheckoutReturnPathRef.current === currentPagePath) {
      return;
    }

    lastCheckoutReturnPathRef.current = currentPagePath;

    if (checkoutStatus === 'success') {
      trackEvent('checkout_success', {
        entityType: 'checkout',
        entityId: params.get('session_id') ?? undefined,
        metadata: { session_id: params.get('session_id') },
      });
    }

    if (checkoutStatus === 'cancelled') {
      trackEvent('checkout_cancelled', {
        entityType: 'checkout',
      });
    }
  }, [currentPagePath, location.search, trackEvent]);

  useEffect(() => {
    const thresholds = [25, 50, 75, 90, 100];

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const depth = Math.round((window.scrollY / scrollableHeight) * 100);
      const matchedThreshold = thresholds.find(
        (threshold) => depth >= threshold && !trackedScrollDepthsRef.current.has(threshold),
      );

      if (!matchedThreshold) {
        return;
      }

      trackedScrollDepthsRef.current.add(matchedThreshold);
      trackEvent('scroll_depth', {
        eventValue: matchedThreshold,
        metadata: { depth_percent: matchedThreshold },
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackEvent]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest('a, button, [data-analytics-event]')
        : null;

      if (!target) {
        return;
      }

      const explicitEvent = target.getAttribute('data-analytics-event');
      const href = target instanceof HTMLAnchorElement ? target.href : null;
      const eventName = explicitEvent || (href ? 'link_click' : 'button_click');

      trackEvent(eventName, {
        metadata: {
          label: getElementLabel(target),
          element_tag: target.tagName.toLowerCase(),
          href,
          is_external_link: href ? new URL(href).hostname !== window.location.hostname : false,
        },
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackEvent]);

  useEffect(() => {
    const sendTimeOnPage = () => {
      const durationSeconds = Math.max(1, Math.round((Date.now() - pageStartedAtRef.current) / 1000));
      trackEvent('time_on_page', {
        eventValue: durationSeconds,
        pagePath: lastPageViewPathRef.current || currentPagePath,
        metadata: { duration_seconds: durationSeconds, source: 'page_exit' },
      });
    };

    window.addEventListener('pagehide', sendTimeOnPage);
    return () => window.removeEventListener('pagehide', sendTimeOnPage);
  }, [currentPagePath, trackEvent]);

  const value = useMemo(
    () => ({
      consent,
      trackEvent,
      acceptAnalytics,
      declineAnalytics,
    }),
    [acceptAnalytics, consent, declineAnalytics, trackEvent],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
      {consent === 'pending' && (
        <div className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-3xl rounded-lg border border-siena-200 bg-white p-4 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-siena-900">{t('analytics.cookie.title')}</h2>
              <p className="mt-1 text-sm text-gray-600">{t('analytics.cookie.description')}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={declineAnalytics}
                className="rounded-md border border-siena-300 px-3 py-2 text-sm font-medium text-siena-700 hover:bg-siena-50"
              >
                {t('analytics.cookie.decline')}
              </button>
              <button
                type="button"
                onClick={acceptAnalytics}
                className="rounded-md bg-siena-500 px-3 py-2 text-sm font-medium text-white hover:bg-siena-600"
              >
                {t('analytics.cookie.accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

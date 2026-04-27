// PostHog browser client wrapper to support Session Replay and better browser tracking
// Using the snippet approach since npm install might be restricted in some environments

const POSTHOG_KEY = import.meta.env['VITE_POSTHOG_KEY'] as string;
const POSTHOG_HOST = import.meta.env['VITE_POSTHOG_HOST'] as string || 'https://us.i.posthog.com';

if (typeof window !== 'undefined' && !window.posthog) {
  (function (t, e) {
    var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) {
      function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (r = t.createElement("script")).type = "text/javascript", r.async = !0, r.src = "https://us-assets.i.posthog.com/static/array.js", (p = t.getElementsByTagName("script")[0]).parentNode.insertBefore(r, p); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on get_distinct_id getGroups get_group_id identify_once person_props_updated".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a])
    }, e.__SV = 1)
  }(document, window.posthog || []));

  window.posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'always',
    session_recording: {
      maskAllInputs: false,
    },
    loaded: (ph) => {
      // If we have a user in storage, identify them immediately
      try {
        const storage = localStorage.getItem('master-fees-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          const userPhone = parsed.state?.userPhone;
          const userId = parsed.state?.userId;
          const identity = userPhone || userId;
          if (identity) {
            ph.identify(identity);
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  });
}

// Wrapper to provide a consistent interface and handle SSR/stubs
// Polished to support both object-style (posthog-node) and positional (posthog-js) arguments
const posthog = {
  capture: (eventOrParams: string | { event: string; properties?: any }, properties?: any) => {
    if (typeof window !== 'undefined' && window.posthog) {
      if (typeof eventOrParams === 'string') {
        window.posthog.capture(eventOrParams, properties);
      } else {
        window.posthog.capture(eventOrParams.event, eventOrParams.properties);
      }
    }
  },
  identify: (distinctIdOrParams: string | { distinctId: string; properties?: any }, properties?: any) => {
    if (typeof window !== 'undefined' && window.posthog) {
      if (typeof distinctIdOrParams === 'string') {
        window.posthog.identify(distinctIdOrParams, properties);
      } else {
        window.posthog.identify(distinctIdOrParams.distinctId, distinctIdOrParams.properties);
      }
    }
  },
  alias: (aliasOrParams: string | { alias: string; distinctId?: string }, distinctId?: string) => {
    if (typeof window !== 'undefined' && window.posthog) {
      if (typeof aliasOrParams === 'string') {
        window.posthog.alias(aliasOrParams, distinctId);
      } else {
        window.posthog.alias(aliasOrParams.alias, aliasOrParams.distinctId);
      }
    }
  },
  reset: () => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.reset();
    }
  },
  on: (event: string, callback: (...args: any[]) => void) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.on(event, callback);
    }
  },
  debug: (enabled: boolean = true) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.debug(enabled);
    }
  }
};

export default posthog;


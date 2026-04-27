import { PostHog } from 'posthog-node';

const posthog = new PostHog(
  import.meta.env['VITE_POSTHOG_KEY'] as string,
  {
    host: import.meta.env['VITE_POSTHOG_HOST'] as string,
    // Flush immediately — this is a short-lived browser context, not a long-running server
    flushAt: 1,
    flushInterval: 0,
  }
);

export default posthog;

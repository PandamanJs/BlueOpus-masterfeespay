// Polyfill process for browser compatibility
if (typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: { NODE_ENV: (import.meta as any).env?.MODE || 'development' },
    browser: true,
    version: 'v20.0.0',
    platform: 'browser',
    argv: [],
    cwd: () => '/',
    nextTick: (fn: any) => setTimeout(fn, 0),
  };
}

export {};

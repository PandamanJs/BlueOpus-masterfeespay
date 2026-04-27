// Browser stub for the Node.js 'process' module
export const env = { NODE_ENV: 'development' };
export const browser = true;
export const version = 'v20.0.0';
export const platform = 'browser';
export const argv = [];
export const cwd = () => '/';
export const nextTick = (fn: (...args: any[]) => void, ...args: any[]) => {
  setTimeout(() => fn(...args), 0);
};

export default {
  env,
  browser,
  version,
  platform,
  argv,
  cwd,
  nextTick,
};

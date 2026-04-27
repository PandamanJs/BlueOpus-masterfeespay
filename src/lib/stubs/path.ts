// Browser stub for the Node.js 'path' module — used by posthog-node's error
// tracking stack-frame modifiers that we don't call from the browser.

export const sep = '/';
export const posix = { sep: '/', dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '.' };
export function dirname(p: string): string { return p.split('/').slice(0, -1).join('/') || '.'; }
export function join(...parts: string[]): string { return parts.join('/').replace(/\/+/g, '/'); }
export function resolve(...parts: string[]): string { return parts.join('/').replace(/\/+/g, '/'); }
export function basename(p: string, ext?: string): string {
  let base = p.split('/').pop() || '';
  if (ext && base.endsWith(ext)) base = base.slice(0, -ext.length);
  return base;
}
export function extname(p: string): string { const m = p.match(/\.[^.]+$/); return m ? m[0] : ''; }
export function relative(from: string, to: string): string { return to; }
export function isAbsolute(p: string): boolean { return p.startsWith('/'); }
export default { sep, posix, dirname, join, resolve, basename, extname, relative, isAbsolute };

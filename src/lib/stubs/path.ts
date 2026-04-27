// Browser stub for the Node.js 'path' module — used by posthog-node's error
// tracking stack-frame modifiers that we don't call from the browser.

export const sep = '/';
export const posix = { 
  sep: '/', 
  dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '.',
  parse: (p: string) => {
    const dir = p.split('/').slice(0, -1).join('/') || '.';
    const base = p.split('/').pop() || '';
    const m = base.match(/\.[^.]+$/);
    const ext = m ? m[0] : '';
    return {
      root: p.startsWith('/') ? '/' : '',
      dir,
      base,
      ext,
      name: base.slice(0, base.length - ext.length)
    };
  }
};
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
export function normalize(p: string): string { return p.replace(/\/+/g, '/'); }
export function parse(p: string) {
  const dir = dirname(p);
  const base = basename(p);
  const ext = extname(p);
  return {
    root: p.startsWith('/') ? '/' : '',
    dir,
    base,
    ext,
    name: base.slice(0, base.length - ext.length)
  };
}
export default { sep, posix, dirname, join, resolve, basename, extname, relative, isAbsolute, normalize, parse };

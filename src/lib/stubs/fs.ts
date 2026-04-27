// Browser stub for node:fs — used by posthog-node context-lines modifier (not called in browser).
export function createReadStream() { return null; }
export function readFileSync() { return ''; }
export function existsSync() { return false; }
export default { createReadStream, readFileSync, existsSync };

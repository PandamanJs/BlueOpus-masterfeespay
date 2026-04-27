// Browser stub for node:async_hooks — used by posthog-node's context module.
// AsyncLocalStorage is not available in browsers; this stub provides a no-op
// implementation so posthog-node can be bundled without errors.

export class AsyncLocalStorage<T> {
  private store: T | undefined;
  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R {
    const prev = this.store;
    this.store = store;
    try {
      return callback(...args);
    } finally {
      this.store = prev;
    }
  }
  getStore(): T | undefined {
    return this.store;
  }
  enterWith(store: T): void {
    this.store = store;
  }
  disable(): void {}
}

export class AsyncResource {
  constructor(_type: string) {}
  runInAsyncScope<R>(fn: (...args: any[]) => R, _thisArg?: any, ...args: any[]): R {
    return fn(...args);
  }
  static bind<Func extends (...args: any[]) => any>(fn: Func): Func {
    return fn;
  }
}

export function createHook() {
  return { enable() {}, disable() {} };
}

export function executionAsyncId() { return 0; }
export function triggerAsyncId() { return 0; }

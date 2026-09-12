export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'Operation',
  signal?: AbortSignal
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const controller = new AbortController();

  if (signal?.aborted) {
    return Promise.reject(new Error(`${label} aborted before start`));
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      // Actually cancel the underlying operation (e.g. the HTTP call inside
      // the provider) instead of only rejecting our wrapper promise.
      controller.abort(new Error(`${label} timed out after ${ms}ms`));
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        const onAbort = () => {
          // Propagate the external abort into our internal controller too.
          if (!controller.signal.aborted) {
            controller.abort((signal.reason as Error) ?? new Error('aborted'));
          }
          reject(new Error(`${label} cancelled: ${(signal.reason as Error)?.message || 'aborted'}`));
        };
        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      })
    : null;

  const raceTargets = abortPromise
    ? [promise, timeoutPromise, abortPromise]
    : [promise, timeoutPromise];

  return Promise.race(raceTargets).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    if (!controller.signal.aborted) controller.abort();
  }) as Promise<T>;
}

/**
 * Builds an AbortSignal that fires on timeout (and/or when an external signal
 * aborts). Passing the returned signal into a provider's generate() call means
 * a hung LLM HTTP request is genuinely cancelled rather than just abandoned.
 */
export function createTimeoutSignal(ms: number, external?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Timed out after ${ms}ms`));
  }, ms);

  controller.signal.addEventListener(
    'abort',
    () => clearTimeout(timer),
    { once: true }
  );

  if (external) {
    if (external.aborted) {
      clearTimeout(timer);
      controller.abort((external.reason as Error) ?? new Error('aborted'));
    } else {
      external.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          controller.abort((external.reason as Error) ?? new Error('aborted'));
        },
        { once: true }
      );
    }
  }

  return controller.signal;
}

export function createCancellablePromise<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  label = 'Operation'
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new Error(`${label} cancelled before start`));
  }
  return executor(signal);
}

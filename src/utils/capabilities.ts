export interface ServerCapabilities {
  internalServer: boolean;
  aiAvailable: boolean;
  shortJoinPrefix?: string;
}

let cachedCapabilitiesPromise: Promise<ServerCapabilities> | null = null;
let cachedCapabilities: ServerCapabilities | null = null;

export function resetCapabilitiesCacheForTesting(): void {
  cachedCapabilitiesPromise = null;
  cachedCapabilities = null;
}

export function getCachedCapabilities(): ServerCapabilities | null {
  if (
    !cachedCapabilities &&
    (typeof window === 'undefined' ||
      (typeof process !== 'undefined' &&
        (process.env?.NODE_ENV === 'test' || process.env?.VITEST)))
  ) {
    cachedCapabilities = { internalServer: false, aiAvailable: false };
  }
  return cachedCapabilities;
}

export async function detectCapabilities(): Promise<ServerCapabilities> {
  if (cachedCapabilitiesPromise) {
    return cachedCapabilitiesPromise;
  }

  // Under Vitest or Node test environments without window / fetch, fallback immediately
  if (
    typeof window === 'undefined' ||
    (typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || process.env?.VITEST))
  ) {
    const fallback: ServerCapabilities = {
      internalServer: false,
      aiAvailable: false,
    };
    cachedCapabilities = fallback;
    return fallback;
  }

  cachedCapabilitiesPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('/api/capabilities', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const result: ServerCapabilities = {
          internalServer: Boolean(data?.internalServer),
          aiAvailable: Boolean(data?.aiAvailable),
          shortJoinPrefix:
            typeof data?.shortJoinPrefix === 'string' && data.shortJoinPrefix.trim()
              ? data.shortJoinPrefix.trim()
              : undefined,
        };
        cachedCapabilities = result;
        return result;
      }
    } catch {
      // Fall through to fallback
    }
    const fallback: ServerCapabilities = {
      internalServer: false,
      aiAvailable: false,
    };
    cachedCapabilities = fallback;
    return fallback;
  })();

  return cachedCapabilitiesPromise;
}

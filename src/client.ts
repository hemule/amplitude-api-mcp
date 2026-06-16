import type { AmplitudeConfig } from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('amplitude-client');

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Path beginning with "/", e.g. "/api/2/taxonomy/event". */
  path: string;
  /** Query string parameters. */
  query?: Record<string, string | number | boolean | undefined>;
  /** JSON body — sets Content-Type: application/json. */
  json?: unknown;
  /** Form body — sets Content-Type: application/x-www-form-urlencoded. Array values are repeated. */
  form?: Record<string, string | number | boolean | string[] | undefined>;
}

export class AmplitudeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = 'AmplitudeApiError';
  }
}

const MAX_RETRIES = 3;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Thin HTTP client for the Amplitude REST API. Holds one project's credentials,
 * adds Basic auth, retries transient failures with exponential backoff, and
 * honours Retry-After on 429.
 *
 * Credentials are injected (not read from globals) so the same code supports
 * multiple projects by instantiating multiple clients.
 */
export class AmplitudeClient {
  private readonly authHeader: string;

  constructor(private readonly config: AmplitudeConfig) {
    const token = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString('base64');
    this.authHeader = `Basic ${token}`;
  }

  async request<T = unknown>(opts: RequestOptions): Promise<T> {
    const url = new URL(this.config.baseUrl + opts.path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: 'application/json',
    };

    let body: string | undefined;
    if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.json);
    } else if (opts.form !== undefined) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.form)) {
        if (v === undefined) continue;
        if (Array.isArray(v)) {
          for (const item of v) params.append(k, item);
        } else {
          params.set(k, String(v));
        }
      }
      body = params.toString();
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.debug('request', { method: opts.method, path: opts.path, attempt });
        const res = await fetch(url, { method: opts.method, headers, body });

        if (res.ok) {
          const text = await res.text();
          return (text ? JSON.parse(text) : {}) as T;
        }

        const errBody = await res.text();
        if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
          const delay = retryDelayMs(res, attempt);
          logger.warn('retrying', { status: res.status, attempt, delay });
          await sleep(delay);
          continue;
        }
        throw new AmplitudeApiError(
          `Amplitude API ${res.status} on ${opts.method} ${opts.path}`,
          res.status,
          errBody,
        );
      } catch (err) {
        lastError = err;
        // Network-level errors are retryable; API errors are not (already handled above).
        if (err instanceof AmplitudeApiError || attempt >= MAX_RETRIES) throw err;
        const delay = retryDelayMs(null, attempt);
        logger.warn('retrying after network error', { attempt, delay });
        await sleep(delay);
      }
    }
    throw lastError;
  }
}

function retryDelayMs(res: Response | null, attempt: number): number {
  const retryAfter = res?.headers.get('retry-after');
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (!Number.isNaN(secs)) return secs * 1000;
  }
  // Exponential backoff: 500ms, 1s, 2s.
  return 500 * 2 ** attempt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

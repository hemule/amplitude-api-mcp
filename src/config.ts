import { z } from 'zod';

/**
 * Region → API base URL. Both Taxonomy, Annotations and Releases share these hosts.
 * See https://amplitude.com/docs/apis/analytics
 */
const REGION_BASE_URLS = {
  us: 'https://amplitude.com',
  eu: 'https://analytics.eu.amplitude.com',
} as const;

const envSchema = z.object({
  AMPLITUDE_API_KEY: z.string().min(1, 'AMPLITUDE_API_KEY is required'),
  AMPLITUDE_SECRET_KEY: z.string().min(1, 'AMPLITUDE_SECRET_KEY is required'),
  AMPLITUDE_REGION: z.enum(['us', 'eu']).default('us'),
  AMPLITUDE_BASE_URL: z.string().url().optional(),
});

export interface AmplitudeConfig {
  apiKey: string;
  secretKey: string;
  /** Resolved base URL, no trailing slash. */
  baseUrl: string;
}

/**
 * Validate the environment and produce a single project's config. Throws a
 * readable error (fail-fast at startup) if anything required is missing.
 *
 * Scale path: this returns ONE project's credentials. To support multiple
 * Amplitude projects, run a second server instance with its own env — no code
 * change. If profile-in-process is ever needed, this is the only place that
 * changes (return a map and resolve by name).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AmplitudeConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }

  const { AMPLITUDE_API_KEY, AMPLITUDE_SECRET_KEY, AMPLITUDE_REGION, AMPLITUDE_BASE_URL } =
    parsed.data;

  const baseUrl = (AMPLITUDE_BASE_URL ?? REGION_BASE_URLS[AMPLITUDE_REGION]).replace(/\/+$/, '');

  return {
    apiKey: AMPLITUDE_API_KEY,
    secretKey: AMPLITUDE_SECRET_KEY,
    baseUrl,
  };
}

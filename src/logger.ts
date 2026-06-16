/**
 * Minimal logger that writes to stderr.
 *
 * IMPORTANT: stdio MCP servers communicate over stdout — anything written there
 * that is not a protocol message corrupts the stream. All logs go to stderr.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Redact anything that looks like a secret/credential before it reaches a log line.
const SECRET_PATTERN = /(api[_-]?key|secret[_-]?key|authorization|password|token)/i;

function redact(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SECRET_PATTERN.test(k) ? '[redacted]' : redact(v);
  }
  return out;
}

export function createLogger(scope: string) {
  const emit = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const line = {
      ts: new Date().toISOString(),
      level,
      scope,
      message,
      ...(meta ? { meta: redact(meta) } : {}),
    };
    process.stderr.write(`${JSON.stringify(line)}\n`);
  };

  return {
    debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
    error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;

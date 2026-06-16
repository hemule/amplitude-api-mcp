import { AmplitudeApiError } from '../client.js';
import type { Logger } from '../logger.js';

/**
 * Shape every tool's structured output shares. Tool-specific fields are merged
 * in on success.
 */
export interface ToolResult {
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
  isError?: boolean;
  // The MCP SDK's CallToolResult type carries an index signature; mirror it so
  // our helper's return type is assignable to a tool handler's return type.
  [key: string]: unknown;
}

export function ok(summary: string, data: Record<string, unknown> = {}): ToolResult {
  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: { success: true, ...data },
  };
}

/**
 * Turn any thrown value into a standard error result. Sets `isError: true` so
 * the MCP client and model see it as a failure, and surfaces the Amplitude
 * status + body when available.
 */
export function fail(error: unknown, logger: Logger, toolName: string): ToolResult {
  let message: string;
  let details: Record<string, unknown> = {};

  if (error instanceof AmplitudeApiError) {
    message = error.message;
    details = { status: error.status, body: error.body };
  } else {
    message = error instanceof Error ? error.message : String(error);
  }

  logger.error(`${toolName} failed`, { error: message, ...details });

  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    structuredContent: { success: false, error: message, ...details },
    isError: true,
  };
}

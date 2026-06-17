import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../client.js';
import { createLogger } from '../logger.js';
import { fail, ok } from './result.js';

const logger = createLogger('releases');

const TS_FORMAT_HINT = 'Format "yyyy-MM-dd HH:mm:ss" in UTC, e.g. "2025-11-01 07:00:00"';

/**
 * Releases tools.
 * https://amplitude.com/docs/apis/analytics/releases
 *
 * NOTE: Amplitude's public Releases API documents ONLY release creation.
 * There are no documented update or list/view endpoints — those actions live
 * in the Amplitude UI. If Amplitude later exposes them, add tools here.
 */
export function registerReleaseTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'releases_create',
    {
      description:
        'Create a release marker. By default it appears as an annotation across charts ' +
        '(set chart_visibility=false to hide it). Note: the Amplitude API supports creating ' +
        'releases only — updating and listing must be done in the Amplitude UI.',
      inputSchema: {
        version: z.string().min(1).describe('Product version, e.g. "1.4.0"'),
        release_start: z.string().min(1).describe(`Release start — ${TS_FORMAT_HINT}`),
        title: z.string().min(1).describe('Release name'),
        release_end: z.string().optional().describe(`Release end — ${TS_FORMAT_HINT}`),
        description: z.string().optional().describe('Release details'),
        platforms: z.array(z.string()).optional().describe('Platforms, e.g. ["iOS","Android"]'),
        created_by: z.string().optional().describe("Creator's name"),
        chart_visibility: z
          .boolean()
          .optional()
          .describe('Show as a chart annotation (default true)'),
      },
      annotations: { title: 'Create Release', readOnlyHint: false },
    },
    async (input) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: '/api/2/release',
          json: input,
        });
        return ok(`Created release "${input.title}" (${input.version}).`, { result: data });
      } catch (e) {
        return fail(e, logger, 'releases_create');
      }
    },
  );
}

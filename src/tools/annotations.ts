import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../client.js';
import { createLogger } from '../logger.js';
import { fail, ok } from './result.js';

const logger = createLogger('annotations');

const ISO_8601_HINT = 'ISO 8601 timestamp, e.g. "2025-11-01T07:00:00+00:00"';

/**
 * Chart Annotations tools (API v3).
 * https://amplitude.com/docs/apis/analytics/chart-annotations
 */
export function registerAnnotationTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'create_annotation',
    {
      description:
        'Create a chart annotation. Omit chart_id to make it globally visible across charts.',
      inputSchema: {
        label: z.string().min(1).describe('Annotation title'),
        start: z.string().min(1).describe(`Start timestamp — ${ISO_8601_HINT}`),
        end: z.string().optional().describe(`End timestamp — ${ISO_8601_HINT}`),
        details: z.string().optional().describe('Additional details / notes'),
        category: z.string().optional().describe('Category name'),
        chart_id: z.string().optional().describe('Chart id to scope the annotation to'),
      },
      annotations: { title: 'Create Annotation', readOnlyHint: false },
    },
    async ({ label, start, end, details, category, chart_id }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: '/api/3/annotations',
          json: { label, start, end, details, category, chart_id },
        });
        return ok(`Created annotation "${label}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'create_annotation');
      }
    },
  );

  server.registerTool(
    'list_annotations',
    {
      description: 'List chart annotations, optionally filtered by category, chart, or time range.',
      inputSchema: {
        category: z.string().optional().describe('Filter by category name'),
        chart_id: z.string().optional().describe('Filter by chart id'),
        start: z.string().optional().describe(`Return annotations after this time — ${ISO_8601_HINT}`),
        end: z.string().optional().describe(`Return annotations before this time — ${ISO_8601_HINT}`),
      },
      annotations: { title: 'List Annotations', readOnlyHint: true },
    },
    async ({ category, chart_id, start, end }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: '/api/3/annotations',
          query: { category, chart_id, start, end },
        });
        return ok('Fetched annotations.', { result: data });
      } catch (e) {
        return fail(e, logger, 'list_annotations');
      }
    },
  );

  server.registerTool(
    'get_annotation',
    {
      description: 'Get a single chart annotation by its numeric id.',
      inputSchema: {
        annotation_id: z.number().int().describe('Annotation id'),
      },
      annotations: { title: 'Get Annotation', readOnlyHint: true },
    },
    async ({ annotation_id }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: `/api/3/annotations/${annotation_id}`,
        });
        return ok(`Fetched annotation ${annotation_id}.`, { result: data });
      } catch (e) {
        return fail(e, logger, 'get_annotation');
      }
    },
  );
}

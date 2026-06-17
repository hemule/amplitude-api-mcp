import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../client.js';
import { createLogger } from '../logger.js';
import { fail, ok } from './result.js';

const logger = createLogger('dashboard');

/** Friendly interval names → Amplitude `i` parameter values. */
const INTERVAL_MAP = {
  realtime: -300000,
  hourly: -3600000,
  daily: 1,
  weekly: 7,
  monthly: 30,
} as const;

/** Accept YYYYMMDD or YYYY-MM-DD and normalise to the API's YYYYMMDD. */
function normalizeDate(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 8) {
    throw new Error(`Invalid date "${input}": expected YYYYMMDD (or YYYY-MM-DD).`);
  }
  return digits;
}

/**
 * Dashboard REST API tools — reading event data.
 * https://amplitude.com/docs/apis/analytics/dashboard-rest
 *
 * Both endpoints are synchronous GETs (no async job/polling).
 */
export function registerDashboardTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'dashboard_events_list',
    {
      description:
        'List all events tracked in the project as seen in the data (with weekly totals and ' +
        'active/deleted/hidden flags). This is the observed event list — distinct from the ' +
        'planned taxonomy (see taxonomy_event_types_list).',
      inputSchema: {},
      annotations: { title: 'List Events (data)', readOnlyHint: true },
    },
    async () => {
      try {
        const data = await client.request({ method: 'GET', path: '/api/2/events/list' });
        return ok('Fetched events list.', { result: data });
      } catch (e) {
        return fail(e, logger, 'dashboard_events_list');
      }
    },
  );

  server.registerTool(
    'dashboard_events_segmentation',
    {
      description:
        'Run an Event Segmentation query: a time-series count of an event over a date range, ' +
        'with optional metric, interval, group-by, and property filters.',
      inputSchema: {
        event_type: z
          .string()
          .min(1)
          .describe('Event name to query, e.g. "Purchase". Use "_active" for any active event, "_all" for all.'),
        start: z.string().min(1).describe('Start date, YYYYMMDD (or YYYY-MM-DD)'),
        end: z.string().min(1).describe('End date, YYYYMMDD (or YYYY-MM-DD)'),
        metric: z
          .enum(['uniques', 'totals', 'pct_dau', 'average', 'histogram', 'sums', 'value_avg'])
          .default('uniques')
          .describe('Aggregation metric'),
        interval: z
          .enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly'])
          .default('daily')
          .describe('Time bucket size'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe('Max number of group-by segments (1-1000, default 100)'),
        group_by: z.string().optional().describe('Property name to segment by'),
        group_by_type: z
          .enum(['event', 'user'])
          .default('event')
          .describe('Whether group_by refers to an event or user property'),
        filters: z
          .array(
            z.object({
              subprop_type: z.enum(['event', 'user']).describe('Property scope'),
              subprop_key: z.string().describe('Property name'),
              subprop_op: z
                .string()
                .describe('Operator, e.g. "is", "is not", "contains", "greater", "less"'),
              subprop_value: z.array(z.string()).describe('Value(s) to match'),
            }),
          )
          .optional()
          .describe('Property filters applied to the event'),
      },
      annotations: { title: 'Event Segmentation', readOnlyHint: true },
    },
    async ({ event_type, start, end, metric, interval, limit, group_by, group_by_type, filters }) => {
      try {
        const e: Record<string, unknown> = { event_type };
        if (filters && filters.length > 0) e.filters = filters;
        if (group_by) e.group_by = [{ type: group_by_type, value: group_by }];

        const data = await client.request({
          method: 'GET',
          path: '/api/2/events/segmentation',
          query: {
            e: JSON.stringify(e),
            start: normalizeDate(start),
            end: normalizeDate(end),
            m: metric,
            i: INTERVAL_MAP[interval],
            limit,
          },
        });
        return ok(`Ran segmentation for "${event_type}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'dashboard_events_segmentation');
      }
    },
  );
}

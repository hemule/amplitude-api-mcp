import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../../client.js';
import { createLogger } from '../../logger.js';
import { fail, ok } from '../result.js';

const logger = createLogger('taxonomy:event-types');

/**
 * Event Type tools for the Taxonomy API.
 * https://amplitude.com/docs/apis/analytics/taxonomy
 */
export function registerEventTypeTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'list_event_types',
    {
      description: 'List all event types in the taxonomy. Optionally include soft-deleted events.',
      inputSchema: {
        show_deleted: z.boolean().default(false).describe('Include soft-deleted event types'),
      },
      annotations: { title: 'List Event Types', readOnlyHint: true },
    },
    async ({ show_deleted }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: '/api/2/taxonomy/event',
          query: show_deleted ? { showDeleted: true } : undefined,
        });
        return ok('Fetched event types.', { result: data });
      } catch (e) {
        return fail(e, logger, 'list_event_types');
      }
    },
  );

  server.registerTool(
    'get_event_type',
    {
      description: 'Get a single event type from the taxonomy by its exact name.',
      inputSchema: {
        event_type: z.string().min(1).describe('The exact event type name, e.g. "Purchase"'),
      },
      annotations: { title: 'Get Event Type', readOnlyHint: true },
    },
    async ({ event_type }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: `/api/2/taxonomy/event/${encodeURIComponent(event_type)}`,
        });
        return ok(`Fetched event type "${event_type}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'get_event_type');
      }
    },
  );

  server.registerTool(
    'create_event_type',
    {
      description: 'Create a new event type in the taxonomy.',
      inputSchema: {
        event_type: z.string().min(1).describe('The event type name to create'),
        category: z.string().optional().describe('Category name to assign the event to'),
        description: z.string().optional().describe('Human-readable description'),
        is_active: z.boolean().optional().describe('Whether the event is active'),
        tags: z.string().optional().describe('Comma-separated tags'),
        owner: z.string().optional().describe('Owner email'),
      },
      annotations: { title: 'Create Event Type', readOnlyHint: false },
    },
    async ({ event_type, category, description, is_active, tags, owner }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: '/api/2/taxonomy/event',
          form: { event_type, category, description, is_active, tags, owner },
        });
        return ok(`Created event type "${event_type}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'create_event_type');
      }
    },
  );

  server.registerTool(
    'update_event_type',
    {
      description: 'Update an existing event type in the taxonomy.',
      inputSchema: {
        event_type: z.string().min(1).describe('The current event type name to update'),
        new_event_type: z.string().optional().describe('Rename the event type to this value'),
        category: z.string().optional().describe('New category name'),
        display_name: z.string().optional().describe('New display name'),
        description: z.string().optional().describe('New description'),
        is_active: z.boolean().optional().describe('Set active/inactive'),
        tags: z.string().optional().describe('Comma-separated tags'),
        owner: z.string().optional().describe('Owner email'),
      },
      annotations: { title: 'Update Event Type', readOnlyHint: false, idempotentHint: true },
    },
    async ({ event_type, ...fields }) => {
      try {
        const data = await client.request({
          method: 'PUT',
          path: `/api/2/taxonomy/event/${encodeURIComponent(event_type)}`,
          form: fields,
        });
        return ok(`Updated event type "${event_type}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'update_event_type');
      }
    },
  );

  server.registerTool(
    'delete_event_type',
    {
      description: 'Soft-delete an event type. Can be restored with restore_event_type.',
      inputSchema: {
        event_type: z.string().min(1).describe('The event type name to delete'),
      },
      annotations: {
        title: 'Delete Event Type',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async ({ event_type }) => {
      try {
        const data = await client.request({
          method: 'DELETE',
          path: `/api/2/taxonomy/event/${encodeURIComponent(event_type)}`,
        });
        return ok(`Deleted event type "${event_type}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'delete_event_type');
      }
    },
  );

  server.registerTool(
    'restore_event_type',
    {
      description: 'Restore a previously soft-deleted event type.',
      inputSchema: {
        event_type: z.string().min(1).describe('The event type name to restore'),
      },
      annotations: { title: 'Restore Event Type', readOnlyHint: false, idempotentHint: true },
    },
    async ({ event_type }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: `/api/2/taxonomy/event/${encodeURIComponent(event_type)}/restore`,
        });
        return ok(`Restored event type "${event_type}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'restore_event_type');
      }
    },
  );
}

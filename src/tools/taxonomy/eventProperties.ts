import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../../client.js';
import { createLogger } from '../../logger.js';
import { fail, ok } from '../result.js';

const logger = createLogger('taxonomy:event-properties');

/**
 * Event Property tools for the Taxonomy API.
 * Event properties are optionally scoped to a specific event_type.
 * https://amplitude.com/docs/apis/analytics/taxonomy
 */
export function registerEventPropertyTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'taxonomy_event_properties_list',
    {
      description: 'List event properties, optionally scoped to a single event type.',
      inputSchema: {
        event_type: z.string().optional().describe('Scope to this event type (omit for all)'),
      },
      annotations: { title: 'List Event Properties', readOnlyHint: true },
    },
    async ({ event_type }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: '/api/2/taxonomy/event-property',
          query: { event_type },
        });
        return ok('Fetched event properties.', { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_event_properties_list');
      }
    },
  );

  server.registerTool(
    'taxonomy_event_properties_get',
    {
      description:
        'Get a single event property by name. Resolves the property whether it is global or ' +
        'scoped to an event type. (Uses the path endpoint GET /event-property/:name, which — ' +
        'unlike the documented query form — actually returns one property.)',
      inputSchema: {
        event_property: z.string().min(1).describe('The event property name'),
      },
      annotations: { title: 'Get Event Property', readOnlyHint: true },
    },
    async ({ event_property }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: `/api/2/taxonomy/event-property/${encodeURIComponent(event_property)}`,
        });
        return ok(`Fetched event property "${event_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_event_properties_get');
      }
    },
  );

  server.registerTool(
    'taxonomy_event_properties_create',
    {
      description: 'Create a new event property.',
      inputSchema: {
        event_property: z.string().min(1).describe('The event property name to create'),
        event_type: z.string().optional().describe('Event type to scope the property to'),
        description: z.string().optional().describe('Human-readable description'),
        type: z
          .enum(['string', 'number', 'boolean', 'enum'])
          .optional()
          .describe('Value type of the property'),
        enum_values: z.array(z.string()).optional().describe('Allowed values when type is "enum"'),
        is_required: z.boolean().optional().describe('Whether the property is required'),
      },
      annotations: { title: 'Create Event Property', readOnlyHint: false },
    },
    async ({ event_property, event_type, description, type, enum_values, is_required }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: '/api/2/taxonomy/event-property',
          form: { event_property, event_type, description, type, enum_values, is_required },
        });
        return ok(`Created event property "${event_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_event_properties_create');
      }
    },
  );

  server.registerTool(
    'taxonomy_event_properties_update',
    {
      description: 'Update an existing event property.',
      inputSchema: {
        event_property: z.string().min(1).describe('The event property name to update'),
        event_type: z.string().optional().describe('Event type the property is scoped to'),
        description: z.string().optional().describe('New description'),
        type: z
          .enum(['string', 'number', 'boolean', 'enum'])
          .optional()
          .describe('New value type'),
        enum_values: z.array(z.string()).optional().describe('Allowed values when type is "enum"'),
        is_required: z.boolean().optional().describe('Whether the property is required'),
      },
      annotations: {
        title: 'Update Event Property',
        readOnlyHint: false,
        idempotentHint: true,
      },
    },
    async ({ event_property, ...fields }) => {
      try {
        const data = await client.request({
          method: 'PUT',
          path: `/api/2/taxonomy/event-property/${encodeURIComponent(event_property)}`,
          form: fields,
        });
        return ok(`Updated event property "${event_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_event_properties_update');
      }
    },
  );

  server.registerTool(
    'taxonomy_event_properties_delete',
    {
      description: 'Soft-delete an event property. Can be restored with taxonomy_event_properties_restore.',
      inputSchema: {
        event_property: z.string().min(1).describe('The event property name to delete'),
        event_type: z.string().optional().describe('Event type the property is scoped to'),
      },
      annotations: {
        title: 'Delete Event Property',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async ({ event_property, event_type }) => {
      try {
        const data = await client.request({
          method: 'DELETE',
          path: `/api/2/taxonomy/event-property/${encodeURIComponent(event_property)}`,
          form: { event_type },
        });
        return ok(`Deleted event property "${event_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_event_properties_delete');
      }
    },
  );

  server.registerTool(
    'taxonomy_event_properties_restore',
    {
      description: 'Restore a previously soft-deleted event property.',
      inputSchema: {
        event_property: z.string().min(1).describe('The event property name to restore'),
        event_type: z.string().optional().describe('Event type the property is scoped to'),
      },
      annotations: { title: 'Restore Event Property', readOnlyHint: false, idempotentHint: true },
    },
    async ({ event_property, event_type }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: `/api/2/taxonomy/event-property/${encodeURIComponent(event_property)}/restore`,
          form: { event_type },
        });
        return ok(`Restored event property "${event_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_event_properties_restore');
      }
    },
  );
}

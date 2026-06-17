import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../../client.js';
import { createLogger } from '../../logger.js';
import { fail, ok } from '../result.js';

const logger = createLogger('taxonomy:user-properties');

/**
 * User Property tools for the Taxonomy API.
 * https://amplitude.com/docs/apis/analytics/taxonomy
 */
export function registerUserPropertyTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'taxonomy_user_properties_list',
    {
      description: 'List all user properties. Optionally include soft-deleted ones.',
      inputSchema: {
        show_deleted: z.boolean().default(false).describe('Include soft-deleted user properties'),
      },
      annotations: { title: 'List User Properties', readOnlyHint: true },
    },
    async ({ show_deleted }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: '/api/2/taxonomy/user-property',
          query: show_deleted ? { showDeleted: true } : undefined,
        });
        return ok('Fetched user properties.', { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_user_properties_list');
      }
    },
  );

  server.registerTool(
    'taxonomy_user_properties_get',
    {
      description: 'Get a single user property by name.',
      inputSchema: {
        user_property: z.string().min(1).describe('The user property name'),
        show_deleted: z.boolean().default(false).describe('Include if soft-deleted'),
      },
      annotations: { title: 'Get User Property', readOnlyHint: true },
    },
    async ({ user_property, show_deleted }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: `/api/2/taxonomy/user-property/${encodeURIComponent(user_property)}`,
          query: show_deleted ? { showDeleted: true } : undefined,
        });
        return ok(`Fetched user property "${user_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_user_properties_get');
      }
    },
  );

  server.registerTool(
    'taxonomy_user_properties_create',
    {
      description: 'Create a new user property.',
      inputSchema: {
        user_property: z.string().min(1).describe('The user property name to create'),
        description: z.string().optional().describe('Human-readable description'),
        type: z
          .enum(['string', 'number', 'boolean', 'enum'])
          .optional()
          .describe('Value type of the property'),
        enum_values: z.array(z.string()).optional().describe('Allowed values when type is "enum"'),
        regex: z.string().optional().describe('Validation regex for the value'),
        is_hidden: z.boolean().optional().describe('Hide the property in the UI'),
      },
      annotations: { title: 'Create User Property', readOnlyHint: false },
    },
    async ({ user_property, description, type, enum_values, regex, is_hidden }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: '/api/2/taxonomy/user-property',
          form: { user_property, description, type, enum_values, regex, is_hidden },
        });
        return ok(`Created user property "${user_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_user_properties_create');
      }
    },
  );

  server.registerTool(
    'taxonomy_user_properties_update',
    {
      description: 'Update an existing user property.',
      inputSchema: {
        user_property: z.string().min(1).describe('The current user property name to update'),
        new_user_property_value: z.string().optional().describe('Rename the user property'),
        description: z.string().optional().describe('New description'),
        type: z.enum(['string', 'number', 'boolean', 'enum']).optional().describe('New value type'),
        enum_values: z.array(z.string()).optional().describe('Allowed values when type is "enum"'),
        regex: z.string().optional().describe('Validation regex for the value'),
        is_hidden: z.boolean().optional().describe('Hide the property in the UI'),
      },
      annotations: { title: 'Update User Property', readOnlyHint: false, idempotentHint: true },
    },
    async ({ user_property, ...fields }) => {
      try {
        const data = await client.request({
          method: 'PUT',
          path: `/api/2/taxonomy/user-property/${encodeURIComponent(user_property)}`,
          form: fields,
        });
        return ok(`Updated user property "${user_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_user_properties_update');
      }
    },
  );

  server.registerTool(
    'taxonomy_user_properties_delete',
    {
      description: 'Soft-delete a user property. Can be restored with taxonomy_user_properties_restore.',
      inputSchema: {
        user_property: z.string().min(1).describe('The user property name to delete'),
      },
      annotations: {
        title: 'Delete User Property',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async ({ user_property }) => {
      try {
        const data = await client.request({
          method: 'DELETE',
          path: `/api/2/taxonomy/user-property/${encodeURIComponent(user_property)}`,
        });
        return ok(`Deleted user property "${user_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_user_properties_delete');
      }
    },
  );

  server.registerTool(
    'taxonomy_user_properties_restore',
    {
      description: 'Restore a previously soft-deleted user property.',
      inputSchema: {
        user_property: z.string().min(1).describe('The user property name to restore'),
      },
      annotations: { title: 'Restore User Property', readOnlyHint: false, idempotentHint: true },
    },
    async ({ user_property }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: `/api/2/taxonomy/user-property/${encodeURIComponent(user_property)}/restore`,
        });
        return ok(`Restored user property "${user_property}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'taxonomy_user_properties_restore');
      }
    },
  );
}

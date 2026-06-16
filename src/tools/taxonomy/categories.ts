import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { AmplitudeClient } from '../../client.js';
import { createLogger } from '../../logger.js';
import { fail, ok } from '../result.js';

const logger = createLogger('taxonomy:categories');

/**
 * Event Category tools for the Taxonomy API.
 *
 * Note the API asymmetry: GET resolves a category by NAME, while PUT/DELETE
 * address it by numeric ID (returned when listing categories).
 * https://amplitude.com/docs/apis/analytics/taxonomy
 */
export function registerCategoryTools(server: McpServer, client: AmplitudeClient): void {
  server.registerTool(
    'list_categories',
    {
      description: 'List all event categories (with their numeric ids).',
      inputSchema: {},
      annotations: { title: 'List Categories', readOnlyHint: true },
    },
    async () => {
      try {
        const data = await client.request({ method: 'GET', path: '/api/2/taxonomy/category' });
        return ok('Fetched categories.', { result: data });
      } catch (e) {
        return fail(e, logger, 'list_categories');
      }
    },
  );

  server.registerTool(
    'get_category',
    {
      description: 'Get a single event category by its name.',
      inputSchema: {
        category_name: z.string().min(1).describe('The category name'),
      },
      annotations: { title: 'Get Category', readOnlyHint: true },
    },
    async ({ category_name }) => {
      try {
        const data = await client.request({
          method: 'GET',
          path: `/api/2/taxonomy/category/${encodeURIComponent(category_name)}`,
        });
        return ok(`Fetched category "${category_name}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'get_category');
      }
    },
  );

  server.registerTool(
    'create_category',
    {
      description: 'Create a new event category.',
      inputSchema: {
        category_name: z.string().min(1).describe('The category name to create'),
      },
      annotations: { title: 'Create Category', readOnlyHint: false },
    },
    async ({ category_name }) => {
      try {
        const data = await client.request({
          method: 'POST',
          path: '/api/2/taxonomy/category',
          form: { category_name },
        });
        return ok(`Created category "${category_name}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'create_category');
      }
    },
  );

  server.registerTool(
    'update_category',
    {
      description: 'Rename an event category by its numeric id (from list_categories).',
      inputSchema: {
        category_id: z.union([z.string(), z.number()]).describe('The numeric category id'),
        category_name: z.string().min(1).describe('The new category name'),
      },
      annotations: { title: 'Update Category', readOnlyHint: false, idempotentHint: true },
    },
    async ({ category_id, category_name }) => {
      try {
        const data = await client.request({
          method: 'PUT',
          path: `/api/2/taxonomy/category/${encodeURIComponent(String(category_id))}`,
          form: { category_name },
        });
        return ok(`Updated category ${category_id} → "${category_name}".`, { result: data });
      } catch (e) {
        return fail(e, logger, 'update_category');
      }
    },
  );

  server.registerTool(
    'delete_category',
    {
      description: 'Delete an event category by its numeric id (from list_categories).',
      inputSchema: {
        category_id: z.union([z.string(), z.number()]).describe('The numeric category id'),
      },
      annotations: {
        title: 'Delete Category',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async ({ category_id }) => {
      try {
        const data = await client.request({
          method: 'DELETE',
          path: `/api/2/taxonomy/category/${encodeURIComponent(String(category_id))}`,
        });
        return ok(`Deleted category ${category_id}.`, { result: data });
      } catch (e) {
        return fail(e, logger, 'delete_category');
      }
    },
  );
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { AmplitudeClient } from '../../client.js';
import { registerCategoryTools } from './categories.js';
import { registerEventPropertyTools } from './eventProperties.js';
import { registerEventTypeTools } from './eventTypes.js';
import { registerUserPropertyTools } from './userProperties.js';

/**
 * Registers all Taxonomy API tools. group-property follows the same shape as the
 * other entities and can be added here when needed (Accounts/groups feature).
 */
export function registerTaxonomyTools(server: McpServer, client: AmplitudeClient): void {
  registerEventTypeTools(server, client);
  registerEventPropertyTools(server, client);
  registerUserPropertyTools(server, client);
  registerCategoryTools(server, client);
}

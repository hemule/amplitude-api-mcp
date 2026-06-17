import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { AmplitudeClient } from './client.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import {
  registerAnnotationTools,
  registerDashboardTools,
  registerReleaseTools,
  registerTaxonomyTools,
} from './tools/index.js';

const logger = createLogger('amplitude-api-mcp');
const VERSION = '0.3.1';

async function main(): Promise<void> {
  // Fail fast with a readable error if credentials/region are misconfigured.
  const config = loadConfig();
  const client = new AmplitudeClient(config);

  const server = new McpServer({ name: 'amplitude-api-mcp', version: VERSION });

  // Tools receive the client (dependency injection) — no module-level globals,
  // so a second project is just a second client/instance.
  registerTaxonomyTools(server, client);
  registerAnnotationTools(server, client);
  registerReleaseTools(server, client);
  registerDashboardTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`amplitude-api-mcp v${VERSION} started`, { baseUrl: config.baseUrl });
}

main().catch((err) => {
  logger.error('fatal startup error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});

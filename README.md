# amplitude-api-mcp

MCP server for the **Amplitude Analytics REST API**. Lets an MCP client (Claude
Code, Claude Desktop, etc.) manage a project's **taxonomy**, **chart
annotations**, and **releases** programmatically.

> This is **not** the official Amplitude product MCP — it's a focused server for
> the Analytics REST API (Taxonomy / Annotations / Releases).

---

## Tools

27 tools across three domains. All write tools carry the appropriate MCP
annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) and return a
structured `{ success, error }` result with `isError` set on failure.

### Taxonomy — Event Types

| Tool | Description | Key params |
|---|---|---|
| `taxonomy_event_types_list` | List all event types | `show_deleted?` |
| `taxonomy_event_types_get` | Get one event type by name | `event_type` |
| `taxonomy_event_types_create` | Create an event type | `event_type`, `category?`, `description?`, `is_active?`, `tags?`, `owner?` |
| `taxonomy_event_types_update` | Update / rename an event type | `event_type`, `new_event_type?`, `category?`, `display_name?`, … |
| `taxonomy_event_types_delete` | Soft-delete an event type | `event_type` |
| `taxonomy_event_types_restore` | Restore a soft-deleted event type | `event_type` |

### Taxonomy — Event Properties

Optionally scoped to a single event type via `event_type`.

| Tool | Description | Key params |
|---|---|---|
| `taxonomy_event_properties_list` | List event properties | `event_type?` |
| `taxonomy_event_properties_get` | Get one event property | `event_property`, `event_type?` |
| `taxonomy_event_properties_create` | Create an event property | `event_property`, `type?`, `enum_values?`, `is_required?`, `event_type?` |
| `taxonomy_event_properties_update` | Update an event property | `event_property`, `description?`, `type?`, `enum_values?`, … |
| `taxonomy_event_properties_delete` | Soft-delete an event property | `event_property`, `event_type?` |
| `taxonomy_event_properties_restore` | Restore a soft-deleted event property | `event_property`, `event_type?` |

### Taxonomy — User Properties

| Tool | Description | Key params |
|---|---|---|
| `taxonomy_user_properties_list` | List user properties | `show_deleted?` |
| `taxonomy_user_properties_get` | Get one user property | `user_property`, `show_deleted?` |
| `taxonomy_user_properties_create` | Create a user property | `user_property`, `type?`, `enum_values?`, `regex?`, `is_hidden?` |
| `taxonomy_user_properties_update` | Update / rename a user property | `user_property`, `new_user_property_value?`, `type?`, … |
| `taxonomy_user_properties_delete` | Soft-delete a user property | `user_property` |
| `taxonomy_user_properties_restore` | Restore a soft-deleted user property | `user_property` |

### Taxonomy — Categories

> API asymmetry: `taxonomy_categories_get` resolves by **name**, while `taxonomy_categories_update` /
> `taxonomy_categories_delete` address the category by its **numeric id** (from `taxonomy_categories_list`).

| Tool | Description | Key params |
|---|---|---|
| `taxonomy_categories_list` | List categories (with ids) | — |
| `taxonomy_categories_get` | Get one category by name | `category_name` |
| `taxonomy_categories_create` | Create a category | `category_name` |
| `taxonomy_categories_update` | Rename a category by id | `category_id`, `category_name` |
| `taxonomy_categories_delete` | Delete a category by id | `category_id` |

### Chart Annotations (API v3)

| Tool | Description | Key params |
|---|---|---|
| `annotations_create` | Create a chart annotation | `label`, `start` (ISO 8601), `end?`, `details?`, `category?`, `chart_id?` |
| `annotations_list` | List annotations, with filters | `category?`, `chart_id?`, `start?`, `end?` |
| `annotations_get` | Get one annotation by id | `annotation_id` |

### Releases

| Tool | Description | Key params |
|---|---|---|
| `releases_create` | Create a release marker | `version`, `release_start` (`yyyy-MM-dd HH:mm:ss` UTC), `title`, `release_end?`, `description?`, `platforms?`, `chart_visibility?` |

> The Amplitude API supports **creating** releases only — there is no documented
> update or list endpoint (those actions live in the Amplitude UI).
>
> **group-property** tools are not included (Accounts/groups is an enterprise
> feature). They follow the same shape as the other taxonomy entities and can be
> added under `src/tools/taxonomy/` when needed.

---

## Installation

### Quick start — run via `npx` (no checkout)

The simplest setup: have your MCP client run the server straight from GitHub.
`npx` clones and builds it on first use; no manual checkout or registry needed.

```json
{
  "mcpServers": {
    "amplitude": {
      "command": "npx",
      "args": ["-y", "github:hemule/amplitude-api-mcp"],
      "env": {
        "AMPLITUDE_API_KEY": "your-api-key",
        "AMPLITUDE_SECRET_KEY": "your-secret-key",
        "AMPLITUDE_REGION": "us"
      }
    }
  }
}
```

Pin to a released tag for stability (recommended), e.g.
`"github:hemule/amplitude-api-mcp#v0.2.0"`.

Then jump to [Configure credentials](#3-configure-credentials) for the full env
reference. The rest of this section covers building from a local checkout.

### 1. Get your Amplitude API credentials

In Amplitude: **Settings → Projects → _your project_ → General**. Copy the
**API Key** and **Secret Key**. Credentials are per-project.

### 2. Build the server

Requires Node.js ≥ 20.

```bash
git clone <your-repo-url> amplitude-api-mcp
cd amplitude-api-mcp
npm install
npm run build        # bundles to dist/index.js
```

Optional checks:

```bash
npm test             # client unit tests (auth header, retry, error handling)
npm run typecheck    # tsc --noEmit
```

### 3. Configure credentials

| Variable | Required | Description |
|---|---|---|
| `AMPLITUDE_API_KEY` | yes | Project API key |
| `AMPLITUDE_SECRET_KEY` | yes | Project secret key |
| `AMPLITUDE_REGION` | no | `us` (default) or `eu` |
| `AMPLITUDE_BASE_URL` | no | Full base URL override (takes precedence over region) |

See [.env.example](.env.example). The server validates these at startup and
exits with a readable error if anything required is missing.

### 4. Register with your MCP client

Add to your MCP config (e.g. `.mcp.json` for Claude Code, or the Claude Desktop
config). Reference the built file with an absolute path:

```json
{
  "mcpServers": {
    "amplitude": {
      "command": "node",
      "args": ["/absolute/path/to/amplitude-api-mcp/dist/index.js"],
      "env": {
        "AMPLITUDE_API_KEY": "your-api-key",
        "AMPLITUDE_SECRET_KEY": "your-secret-key",
        "AMPLITUDE_REGION": "us"
      }
    }
  }
}
```

Restart the client; the `amplitude` server's tools become available.

### Local development

```bash
npm run dev          # tsx watch — runs from source, reloads on change
```

---

## Multiple Amplitude projects

This server holds **one** project's credentials. To work with a second project,
register a **second server instance** with its own env — for example:

```json
{
  "mcpServers": {
    "amplitude-prod":    { "command": "node", "args": ["/path/dist/index.js"], "env": { "AMPLITUDE_API_KEY": "...", "AMPLITUDE_SECRET_KEY": "..." } },
    "amplitude-staging": { "command": "node", "args": ["/path/dist/index.js"], "env": { "AMPLITUDE_API_KEY": "...", "AMPLITUDE_SECRET_KEY": "..." } }
  }
}
```

No code changes are needed — credentials are injected into the client rather than
read from module globals, so each instance is fully isolated.

---

## License

MIT

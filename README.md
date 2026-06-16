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
| `list_event_types` | List all event types | `show_deleted?` |
| `get_event_type` | Get one event type by name | `event_type` |
| `create_event_type` | Create an event type | `event_type`, `category?`, `description?`, `is_active?`, `tags?`, `owner?` |
| `update_event_type` | Update / rename an event type | `event_type`, `new_event_type?`, `category?`, `display_name?`, … |
| `delete_event_type` | Soft-delete an event type | `event_type` |
| `restore_event_type` | Restore a soft-deleted event type | `event_type` |

### Taxonomy — Event Properties

Optionally scoped to a single event type via `event_type`.

| Tool | Description | Key params |
|---|---|---|
| `list_event_properties` | List event properties | `event_type?` |
| `get_event_property` | Get one event property | `event_property`, `event_type?` |
| `create_event_property` | Create an event property | `event_property`, `type?`, `enum_values?`, `is_required?`, `event_type?` |
| `update_event_property` | Update an event property | `event_property`, `description?`, `type?`, `enum_values?`, … |
| `delete_event_property` | Soft-delete an event property | `event_property`, `event_type?` |
| `restore_event_property` | Restore a soft-deleted event property | `event_property`, `event_type?` |

### Taxonomy — User Properties

| Tool | Description | Key params |
|---|---|---|
| `list_user_properties` | List user properties | `show_deleted?` |
| `get_user_property` | Get one user property | `user_property`, `show_deleted?` |
| `create_user_property` | Create a user property | `user_property`, `type?`, `enum_values?`, `regex?`, `is_hidden?` |
| `update_user_property` | Update / rename a user property | `user_property`, `new_user_property_value?`, `type?`, … |
| `delete_user_property` | Soft-delete a user property | `user_property` |
| `restore_user_property` | Restore a soft-deleted user property | `user_property` |

### Taxonomy — Categories

> API asymmetry: `get_category` resolves by **name**, while `update_category` /
> `delete_category` address the category by its **numeric id** (from `list_categories`).

| Tool | Description | Key params |
|---|---|---|
| `list_categories` | List categories (with ids) | — |
| `get_category` | Get one category by name | `category_name` |
| `create_category` | Create a category | `category_name` |
| `update_category` | Rename a category by id | `category_id`, `category_name` |
| `delete_category` | Delete a category by id | `category_id` |

### Chart Annotations (API v3)

| Tool | Description | Key params |
|---|---|---|
| `create_annotation` | Create a chart annotation | `label`, `start` (ISO 8601), `end?`, `details?`, `category?`, `chart_id?` |
| `list_annotations` | List annotations, with filters | `category?`, `chart_id?`, `start?`, `end?` |
| `get_annotation` | Get one annotation by id | `annotation_id` |

### Releases

| Tool | Description | Key params |
|---|---|---|
| `create_release` | Create a release marker | `version`, `release_start` (`yyyy-MM-dd HH:mm:ss` UTC), `title`, `release_end?`, `description?`, `platforms?`, `chart_visibility?` |

> The Amplitude API supports **creating** releases only — there is no documented
> update or list endpoint (those actions live in the Amplitude UI).
>
> **group-property** tools are not included (Accounts/groups is an enterprise
> feature). They follow the same shape as the other taxonomy entities and can be
> added under `src/tools/taxonomy/` when needed.

---

## Installation

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

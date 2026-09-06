# MongoDB MCP That Works

<!-- mcp-name: io.github.sourabhshegane/mongodb-mcp-that-works -->

[![npm version](https://img.shields.io/npm/v/@sourabhshegane/mongodb-mcp-that-works?color=blue)](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works)
[![npm downloads](https://img.shields.io/npm/dt/@sourabhshegane/mongodb-mcp-that-works?color=blue)](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works)
[![npm weekly downloads](https://img.shields.io/npm/dw/@sourabhshegane/mongodb-mcp-that-works?color=blue)](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works)
[![CI](https://github.com/sourabhshegane/mongodb-mcp-that-works/actions/workflows/ci.yml/badge.svg)](https://github.com/sourabhshegane/mongodb-mcp-that-works/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/sourabhshegane/mongodb-mcp-that-works)](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases)
[![license](https://img.shields.io/github/license/sourabhshegane/mongodb-mcp-that-works)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/sourabhshegane/mongodb-mcp-that-works)](https://github.com/sourabhshegane/mongodb-mcp-that-works)
[![node](https://img.shields.io/badge/node-%3E%3D16-green)](package.json)

A reliable MongoDB MCP (Model Context Protocol) server with built-in schema discovery and field validation. It's a standard MCP server over stdio, so it connects to **any** MCP client — Claude Desktop, Claude Code, OpenAI Codex, Cursor, VS Code / GitHub Copilot, Zed, and more.

> **Published on npm**: [`@sourabhshegane/mongodb-mcp-that-works`](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works) · Install with `npx -y @sourabhshegane/mongodb-mcp-that-works`

> [!CAUTION]
> This server connects to your MongoDB with **full read/write access** to whatever user and database you supply via `MONGODB_URI`, and it exposes write tools (`insertOne`, `updateOne`, `deleteOne`) to any connected client. Only register it with MCP clients you trust. For high-risk environments, use a read-only MongoDB user or a dedicated database.

## Features

- 🔍 **Schema Discovery**: Automatically analyze collection structures
- ✅ **Field Validation**: Prevent field name mistakes
- 📊 **Full MongoDB Support**: Find, aggregate, insert, update, delete operations
- 🚀 **High Performance**: Efficient connection pooling and query optimization
- 🔐 **Secure**: Support for MongoDB Atlas and authentication
- 🎯 **Type-Safe**: Built with TypeScript and Zod validation

## Installation

### Install from npm

```bash
npm install -g @sourabhshegane/mongodb-mcp-that-works
```

## Configuration

This is a standard stdio MCP server. Any MCP client launches it with `npx` and passes two environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/database` |
| `MONGODB_DATABASE` | No | Default database name (falls back to the URI's database) |

Every client below uses the same launch command:

```bash
npx -y @sourabhshegane/mongodb-mcp-that-works@latest
```

The `-y` flag auto-confirms the install so the client never hangs on an interactive prompt.

> **Security**: never commit a real connection string. The examples use placeholders, or reference environment variables (`${env:...}`, `env_vars`, `${input:...}`) so credentials stay out of version control.

### Claude Desktop

Edit your Claude Desktop config:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"],
      "env": {
        "MONGODB_URI": "mongodb+srv://<user>:<password>@cluster.mongodb.net/<database>",
        "MONGODB_DATABASE": "your_database_name"
      }
    }
  }
}
```

### Claude Code

Add it with the CLI (anything after `--` is the server command):

```bash
claude mcp add mongodb --scope user \
  --env MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<database> \
  -- npx -y @sourabhshegane/mongodb-mcp-that-works@latest
```

Or commit a project-scoped `.mcp.json` (secrets referenced with `${VAR}`):

```json
{
  "mcpServers": {
    "mongodb": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"],
      "env": {
        "MONGODB_URI": "${MONGODB_URI}",
        "MONGODB_DATABASE": "${MONGODB_DATABASE:-your_database_name}"
      }
    }
  }
}
```

Scopes: `local` → `~/.claude.json`, `project` → `.mcp.json`, `user` → `~/.claude.json`. Verify with `claude mcp list`.

### OpenAI Codex

Codex uses **TOML** (not JSON). Add to `~/.codex/config.toml` (or project-scoped `.codex/config.toml`):

```toml
[mcp_servers.mongodb]
command = "npx"
args = ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"]
env = { MONGODB_URI = "mongodb+srv://<user>:<password>@cluster.mongodb.net/<database>", MONGODB_DATABASE = "your_database_name" }
startup_timeout_sec = 30
```

Or forward variables from your shell instead of inlining them:

```toml
[mcp_servers.mongodb]
command = "npx"
args = ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"]
env_vars = ["MONGODB_URI", "MONGODB_DATABASE"]
```

Or add it with the CLI: `codex mcp add mongodb -- npx -y @sourabhshegane/mongodb-mcp-that-works@latest`. Verify with `codex mcp list`.

### Cursor

Project scope — `.cursor/mcp.json` (commit it to share with your team). Global scope — `~/.cursor/mcp.json`.

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"],
      "env": {
        "MONGODB_URI": "${env:MONGODB_URI}",
        "MONGODB_DATABASE": "${env:MONGODB_DATABASE}"
      }
    }
  }
}
```

### VS Code / GitHub Copilot

For quick installation, click the buttons below. After install, replace the placeholder connection string in your config:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=mongodb&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40sourabhshegane%2Fmongodb-mcp-that-works%40latest%22%5D%2C%22env%22%3A%7B%22MONGODB_URI%22%3A%22mongodb%2Bsrv%3A%2F%2Fuser%3Apassword%40cluster.mongodb.net%2Fdatabase%22%7D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=mongodb&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40sourabhshegane%2Fmongodb-mcp-that-works%40latest%22%5D%2C%22env%22%3A%7B%22MONGODB_URI%22%3A%22mongodb%2Bsrv%3A%2F%2Fuser%3Apassword%40cluster.mongodb.net%2Fdatabase%22%7D%7D&quality=insiders)

Note: VS Code's root key is **`servers`** (other clients use `mcpServers`), and `type` is required. `.vscode/mcp.json`:

```json
{
  "servers": {
    "mongodb": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"],
      "env": {
        "MONGODB_URI": "${input:mongodb-uri}"
      }
    }
  },
  "inputs": [
    {
      "id": "mongodb-uri",
      "type": "promptString",
      "description": "MongoDB connection string",
      "password": true
    }
  ]
}
```

### Zed

Add to `settings.json` (`~/.config/zed/settings.json` or `.zed/settings.json`):

```json
{
  "mcp": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"],
      "env": {
        "MONGODB_URI": "mongodb+srv://<user>:<password>@cluster.mongodb.net/<database>"
      }
    }
  }
}
```

## Available Tools

### 1. `listCollections`
List all collections in the database.

```javascript
// Example
mcp.listCollections({ filter: {} })
```

### 2. `find`
Find documents in a collection with filtering, sorting, and pagination.

```javascript
// Example
mcp.find({
  collection: "users",
  filter: { status: "active" },
  sort: { createdAt: -1 },
  limit: 10
})
```

### 3. `findOne`
Find a single document.

```javascript
// Example
mcp.findOne({
  collection: "users",
  filter: { email: "user@example.com" }
})
```

### 4. `aggregate`
Run aggregation pipelines.

```javascript
// Example
mcp.aggregate({
  collection: "orders",
  pipeline: [
    { $match: { status: "completed" } },
    { $group: { _id: "$userId", total: { $sum: "$amount" } } }
  ]
})
```

### 5. `count`
Count documents matching a filter.

```javascript
// Example
mcp.count({
  collection: "products",
  filter: { inStock: true }
})
```

### 6. `distinct`
Get distinct values for a field.

```javascript
// Example
mcp.distinct({
  collection: "orders",
  field: "status"
})
```

### 7. `insertOne`
Insert a single document.

```javascript
// Example
mcp.insertOne({
  collection: "users",
  document: { name: "John Doe", email: "john@example.com" }
})
```

### 8. `updateOne`
Update a single document.

```javascript
// Example
mcp.updateOne({
  collection: "users",
  filter: { _id: "123" },
  update: { $set: { status: "active" } }
})
```

### 9. `deleteOne`
Delete a single document.

```javascript
// Example
mcp.deleteOne({
  collection: "users",
  filter: { _id: "123" }
})
```

### 10. `getSchema`
Analyze collection structure and discover field names.

```javascript
// Example
mcp.getSchema({
  collection: "users",
  sampleSize: 100
})

// Returns:
{
  "collection": "users",
  "sampleSize": 100,
  "fields": {
    "_id": {
      "types": ["ObjectId"],
      "examples": ["507f1f77bcf86cd799439011"],
      "frequency": "100/100",
      "percentage": 100
    },
    "email": {
      "types": ["string"],
      "examples": ["user@example.com"],
      "frequency": "100/100",
      "percentage": 100
    }
  }
}
```

### Tool annotations (MCP hints)

Tools are annotated with [MCP ToolAnnotations](https://modelcontextprotocol.io/specification/2025-03-26/server/tools#toolannotations) so clients can distinguish **read-only** tools from write-capable tools and flag operations that are destructive:

| Tool              | readOnlyHint | idempotentHint | destructiveHint | Notes                                              |
|-------------------|--------------|----------------|-----------------|----------------------------------------------------|
| `listCollections` | `true`       | –              | –               | Pure read                                         |
| `find`            | `true`       | –              | –               | Pure read                                         |
| `findOne`         | `true`       | –              | –               | Pure read                                         |
| `aggregate`       | `true`       | –              | –               | Pure read (may also run write stages)             |
| `count`           | `true`       | –              | –               | Pure read                                         |
| `distinct`        | `true`       | –              | –               | Pure read                                         |
| `getSchema`       | `true`       | –              | –               | Pure read                                         |
| `insertOne`       | `false`      | `false`        | `false`         | Additive; retrying inserts a new document         |
| `updateOne`       | `false`      | `false`        | `true`          | Modifies existing docs; `$inc`/`$push` are non-idempotent |
| `deleteOne`       | `false`      | `true`         | `true`          | Deleting an already-absent document is a no-op    |

> Note: `aggregate` is annotated read-only, but it can contain write stages (e.g. `$out`, `$merge`) — inspect pipelines before running.

## Best Practices

1. **Use Schema Discovery First**: Before querying, run `getSchema` to understand field names
2. **Handle ObjectIds**: The server automatically converts string IDs to ObjectIds
3. **Use Projections**: Limit returned fields to improve performance
4. **Batch Operations**: Use aggregation pipelines for complex queries

## Examples

### Basic Usage

```javascript
// Get schema first to avoid field name mistakes
const schema = await mcp.getSchema({ collection: "reports" });

// Use correct field names from schema
const reports = await mcp.find({
  collection: "reports",
  filter: { organization_id: "64ba7374f8b63db2083b2665" },
  limit: 10
});
```

### Advanced Aggregation

```javascript
const analytics = await mcp.aggregate({
  collection: "orders",
  pipeline: [
    { $match: { createdAt: { $gte: new Date("2024-01-01") } } },
    { $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      revenue: { $sum: "$amount" },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]
});
```

## Debugging

You can use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to debug the server, inspect tool schemas, and call tools interactively:

```bash
npx @modelcontextprotocol/inspector npx -y @sourabhshegane/mongodb-mcp-that-works@latest
```

Set `MONGODB_URI` (and optionally `MONGODB_DATABASE`) in your environment before launching the inspector.

## Troubleshooting

### Connection Issues
- Verify your MongoDB URI is correct
- Check network connectivity to MongoDB Atlas
- Ensure IP whitelist includes your current IP

### Field Name Errors
- Always use `getSchema` to discover correct field names
- Remember MongoDB is case-sensitive
- Check for typos in nested field paths (e.g., "user.profile.name")

### Performance
- Use indexes for frequently queried fields
- Limit result sets with `limit` parameter
- Use projections to return only needed fields

## Contributing

Contributions are welcome — new tools, bug fixes, examples, and documentation improvements. Pull requests and issues are appreciated. See [CHANGELOG.md](CHANGELOG.md) for release history. For examples of other MCP servers, see the [reference implementations](https://github.com/modelcontextprotocol/servers).

## License

MIT License - see LICENSE file for details

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full history.

| Version | npm | GitHub Release | Highlights |
|---------|-----|----------------|------------|
| 0.1.7 | [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works/v/0.1.7) | [v0.1.7](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.7) | ToolAnnotations, SDK 1.30, repo-standard docs |
| 0.1.6 | [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works/v/0.1.6) | [v0.1.6](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.6) | CI/CD, changelog, and repo badges |
| 0.1.5 | [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works/v/0.1.5) | [v0.1.5](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.5) | Post-migration metadata & ownership fixes |
| 0.1.3 | [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works/v/0.1.3) | [v0.1.3](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.3) | Published with `@latest` install docs |
| 0.1.2 | [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works/v/0.1.2) | [v0.1.2](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.2) | Repo URLs updated to mongodb-mcp-that-works |
| 0.1.0 | [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works/v/0.1.0) | [v0.1.0](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.0) | Initial release |

## Releases

All versions published to npm also have tagged GitHub Releases with build checks. The repo uses [GitHub Actions](https://github.com/sourabhshegane/mongodb-mcp-that-works/actions) for continuous integration and automated publishing:

- Tag pushes (`v*`) trigger lint/build checks and, once checks pass, an automated npm publish
- Every published version has a matching [GitHub Release](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases)

---

Made out of pain since the official MongoDB MCP didn't work for me
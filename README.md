# MongoDB That Works - MCP Server

[![npm version](https://img.shields.io/npm/v/@sourabhshegane/mongodb-mcp-that-works?color=blue)](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works)
[![npm downloads](https://img.shields.io/npm/dm/@sourabhshegane/mongodb-mcp-that-works)](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works)
[![CI](https://github.com/sourabhshegane/mongodb-mcp-that-works/actions/workflows/ci.yml/badge.svg)](https://github.com/sourabhshegane/mongodb-mcp-that-works/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/sourabhshegane/mongodb-mcp-that-works)](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases)
[![license](https://img.shields.io/github/license/sourabhshegane/mongodb-mcp-that-works)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/sourabhshegane/mongodb-mcp-that-works)](https://github.com/sourabhshegane/mongodb-mcp-that-works)
[![node](https://img.shields.io/badge/node-%3E%3D16-green)](package.json)

A reliable MongoDB MCP (Model Context Protocol) server that provides seamless MongoDB integration for Claude Desktop with built-in schema discovery and field validation.

> **Published on npm**: [`@sourabhshegane/mongodb-mcp-that-works`](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works) · Install with `npx -y @sourabhshegane/mongodb-mcp-that-works`

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

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@sourabhshegane/mongodb-mcp-that-works@latest"],
      "env": {
        "MONGODB_URI": "mongodb+srv://username:password@cluster.mongodb.net/database",
        "MONGODB_DATABASE": "your_database_name"
      }
    }
  }
}
```

### Configuration Options

- `MONGODB_URI`: Your MongoDB connection string (required)
- `MONGODB_DATABASE`: Default database name (optional)

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

## License

MIT License - see LICENSE file for details

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full history.

| Version | npm | GitHub Release | Highlights |
|---------|-----|----------------|------------|
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
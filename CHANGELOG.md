# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). All versions below are published on [npm](https://www.npmjs.com/package/@sourabhshegane/mongodb-mcp-that-works) with a matching [GitHub Release](https://github.com/sourabhshegane/mongodb-mcp-that-works/releases).

## [0.1.8] - 2026-09-06

### Added
- Automated test suite: `npm test` runs protocol/annotation unit tests plus an end-to-end CRUD suite against a real MongoDB (auto-skips when no MongoDB is reachable)
- CI now runs the full unit + e2e suite against a `mongo:7` service container (Node 18/20/22)

## [0.1.7] - 2026-09-06

### Added
- MCP [ToolAnnotations](https://modelcontextprotocol.io/specification/2025-03-26/server/tools#toolannotations) on all tools (`readOnlyHint`, `idempotentHint`, `destructiveHint`) so clients can distinguish read-only from write tools
- README sections: security `[!CAUTION]` callout, tool annotations table, VS Code one-click install buttons, MCP Inspector debugging guide, Contributing
- `mcp-name` metadata comment for the MCP registry/directory

### Changed
- Upgraded `@modelcontextprotocol/sdk` from 0.5 to 1.30 (2025-03-26 spec)

## [0.1.6] - 2026-09-06

### Added
- Repo badges (npm, CI, license, stars) and an npm + Releases section in the README
- `CHANGELOG.md` documenting all published versions
- GitHub Actions CI workflow (build + smoke test) running on Node 18/20/22
- GitHub Actions release workflow that publishes to npm and creates a GitHub Release on `v*` tag pushes

## [0.1.5] - 2026-09-06

### Fixed
- npm package metadata for account/ownership migration
- Repository URLs and maintainer info point to `sourabhshegane/mongodb-mcp-that-works`

## [0.1.3] - 2025-06-19

### Changed
- README installation docs use `@latest` tag for npx installs

## [0.1.2] - 2025-06-19

### Changed
- Repository URLs updated to `mongodb-mcp-that-works` after transfer

## [0.1.0] - 2025-06-19

### Added
- Initial release
- Full MongoDB CRUD operations (`find`, `findOne`, `aggregate`, `count`, `distinct`, `insertOne`, `updateOne`, `deleteOne`)
- Schema discovery tool (`getSchema`)
- Automatic ObjectId conversion
- TypeScript support with Zod validation
- MCP stdio server compatible with Claude Desktop

[0.1.8]: https://github.com/sourabhshegane/mongodb-mcp-that-works/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/sourabhshegane/mongodb-mcp-that-works/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/sourabhshegane/mongodb-mcp-that-works/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/sourabhshegane/mongodb-mcp-that-works/compare/v0.1.3...v0.1.5
[0.1.3]: https://github.com/sourabhshegane/mongodb-mcp-that-works/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/sourabhshegane/mongodb-mcp-that-works/compare/v0.1.0...v0.1.2
[0.1.0]: https://github.com/sourabhshegane/mongodb-mcp-that-works/releases/tag/v0.1.0
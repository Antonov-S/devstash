# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Neon MCP Usage

When using any `mcp__neon__*` tool in this repo, follow these rules **without exception**:

- **Project:** Always use the `devstash` project (`projectId: lively-sun-79308869`). Never query, describe, or otherwise touch any other Neon project unless I explicitly name it in the current message.
- **Branch:** Always pass `branchId: br-lingering-band-alvxovnj` (the `development` branch). Never run anything against the `production` branch (`br-bitter-art-alhndz9m`) or its endpoint unless I explicitly say "production" in the current message.
- **Default assumption:** If I ask a Neon-related question without naming a project or branch, assume `devstash` + `development`. Do not ask — just proceed with those defaults and mention which branch you used in your reply.
- **No project/branch discovery:** Do not call `list_projects` or enumerate branches to "find" the right one. The IDs above are authoritative.
- **Read-only by default:** Even though the MCP server is configured read-only, never attempt schema changes, data mutations, or branch/endpoint management against any branch. Schema changes go through Prisma migrations (see `coding-standards.md`), not MCP.
- **Cross-branch / cross-project work:** Only allowed when I explicitly request it in the current message (e.g. "compare dev vs production", "check the staging project"). A prior approval does not carry over to later messages.
- **Production safety:** If I ask for something that would require production data, stop and confirm before running anything against `br-bitter-art-alhndz9m`.

**IMPORTANT:** Do not add Claude to any commit messages.

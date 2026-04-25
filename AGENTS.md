# AGENTS.md

## Package Manager

**pnpm** is required. Do not use npm or yarn.

## Build Order (Critical)

Build commands have dependencies — run in this order:

```bash
pnpm install
pnpm run build:prepare   # builds rpc, then webview (must run before compile)
pnpm run compile          # compiles the main extension
```

## Package Structure

```
packages/
├── main/       # VS Code extension host (webpack bundling)
├── rpc/        # Shared RPC lib (code-assit-rpc) — must be built before main/webview
└── webview/    # Vue 3 frontend (Vite) — embeds rpc via workspace:*
```

- `packages/rpc` is a published lib (not code-assist-rpc — that dir is empty/missing)
- Both `main` and `webview` depend on `code-assit-rpc` via `workspace:*`

## Developer Commands

| Command | Purpose |
|---------|---------|
| `pnpm run build:rpc` | Build only the RPC library |
| `pnpm run build:webview` | Build only the webview |
| `pnpm run build:prepare` | Build rpc + webview (fast, no bundling) |
| `pnpm run compile` | Full build: prepare + webpack bundle |
| `pnpm run watch` | Watch mode (rpc + webview + webpack watch) |
| `pnpm run package` | Production bundle |
| `pnpm run lint` | ESLint on all packages |
| `pnpm run lint:fix` | ESLint with auto-fix |
| `pnpm run test` | Run tests (requires `pretest` first) |
| `pnpm run vsce` | Package as .vsix |

Test flow: `pnpm run pretest` runs `compile-tests + compile + lint` before tests.

## Extension Architecture

- **Entry point**: `packages/main/src/extension.ts`
- **Webview provider**: `packages/main/src/views/ChatWebViewProvider.ts`
- **Webview entry**: `packages/webview/src/main.ts` + `App.vue`
- **Commands**: All `codeAssist.*` commands are registered in `extension.ts` and use the same pattern — open webview, send selection, trigger a prompt type.
- **Streaming**: Responses use the OpenAI streaming API and are streamed to the webview via RPC.

## VS Code Debug

Use the "Run Extension" launch config in `.vscode/launch.json` — it automatically runs the `watch` task as a pre-launch step.
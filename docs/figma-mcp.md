# Figma MCP: setup, specs, and implementation

Connect your coding assistant once, extract a design contract, then implement it in your project's own framework. Installing this toolkit installs prompts; it does **not** connect your Figma account or grant access to files.

## 1. Connect Figma

Use the official remote endpoint `https://mcp.figma.com/mcp` and complete Figma OAuth. No personal access token is needed for this route. Choose one setup below; preserve your existing MCP servers when adding configuration.

### Codex

In the Codex app, open Plugins, find Figma, install it, and complete authentication. Alternatively, with Codex CLI installed:

```sh
codex mcp add figma --url https://mcp.figma.com/mcp
codex mcp login figma
codex mcp list
```

### Claude Code

```sh
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Start a new session, run `/mcp`, select Figma, and authenticate. Use `--scope user` on the add command if you want it across projects.

### Cursor

Use `/add-plugin figma` in agent chat and authenticate, or follow Figma's manual Cursor installation guide linked below.

### VS Code

Run **MCP: Open Workspace Folder MCP Configuration** (or **MCP: Open User Configuration** for global setup). Merge this entry into the `servers` object:

```json
{
  "servers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

Start the server and complete authentication. This `servers` shape belongs to VS Code; do not paste it into clients expecting `mcpServers` or TOML.

### Desktop alternative

Open the file in Figma desktop, switch to Dev Mode, and enable the desktop MCP server in the inspect panel. Configure your supported client with Streamable HTTP URL `http://127.0.0.1:3845/mcp`. Keep Figma desktop running on the same machine as the MCP client. Desktop access depends on your seat/plan; consult current Figma documentation. Selection-based prompts are available here; use explicit frame links for reproducible handoffs.

### Check the connection

Copy a frame's link, including `node-id`, from a file your authenticated account can access. Ask:

```text
Use Figma MCP to read this frame's metadata and capture a reference screenshot.
Report the file key, node ID, tools available, and any access failures.
Do not change the Figma file or app code.
URL: paste your frame link here
```

Success means a real node read and screenshot, not just a configured server. Tool names and capabilities vary by client and server. Load the Figma plugin's prerequisite skills when supplied, especially before `get_design_context` or `use_figma`. `use_figma` is optional; do not require it for basic design-to-code.

## 2. Load the toolkit workflows

```sh
npx mobile-ai-agents install
```

Select your coding tool and platform. Install the portable extraction and verification helpers inside your target project:

```sh
npx mobile-ai-agents figma tools init
```

This preserves existing helper files. Read `tools/figma-spec/README.md` for Python prerequisites, raw-dump conversion, strict validation and screenshot comparison. In a checkout of this toolkit, you can also run `node /absolute/path/to/mobile-dev-skills/cli/index.js figma tools init` from the target project. Available starting with v1.0.38.

 The three Figma skills are included for every platform. In tools supporting the installed slash commands:

```text
/figma-mcp-setup
Help me connect Figma MCP and verify a read of my frame.

/figma-spec-harvest
URL: paste your frame link here
FEATURE: checkout
SCOPE: this frame and its variants
Extract written requirements, exact available values, assets, and reference screenshots.

/figma-to-implementation
SPEC: docs/design-spec/checkout
PLATFORM: detect from this repository
Implement the verified scope and report requirement and screenshot evidence.
```

For tools without those commands, ask the assistant to read the corresponding `skills/cross-platform/figma-*.md` files. Use `/figma-to-code` for the combined workflow; `/figma` remains the component translation agent. There is no automatic Figma authentication during toolkit installation. The existing `mobile-ai-agents mcp setup` command configures **Mobile MCP device QA**, not Figma.

## 3. Platform mapping

| Target | Native implementation | Verification |
|---|---|---|
| Android | Compose or existing XML Views; semantic theme tokens | Gradle checks and emulator/device captures |
| iOS | SwiftUI or existing UIKit; dynamic type and safe areas | Xcode build/tests and simulator/device captures |
| Flutter | Existing Dart state management, bounded flex/scroll layout | Analyze, widget tests, golden/device captures |
| React Native | Existing JS/TS components and navigation | Project checks and iOS/Android captures |
| Kotlin Multiplatform | Existing shared UI or separate native UIs | Checks/captures per rendered target |
| Unity | Existing UI Toolkit or uGUI; canvas scaling and anchors | Editor/player checks and target resolution captures |
| Unreal | Existing UMG/Slate; anchors and DPI scaling | Compile/automation and viewport captures |
| Web or other framework | User-selected repository stack | Native build/tests and browser/runtime captures |

Figma pixels describe the reference canvas. Record how they map to logical dp/pt/framework units and responsive constraints; do not use device pixel ratio as a universal conversion. A generated React/Tailwind snippet is evidence about the design, not a reason to change the project's platform.

## Troubleshooting

- **No tools:** restart the client/session, confirm the server is enabled, and check client support. If both remote and desktop are configured, confirm which server is selected.
- **Access denied:** authenticate the account that can open the design; a shared URL does not guarantee API access.
- **Rate limit:** record incomplete scope, retry within server guidance, and resume from saved evidence. Do not report a partial harvest as complete.
- **Missing exact values or written notes:** request the missing export/data or use read-only file inspection if available. Record unknowns; screenshots cannot prove exact token values or hidden behavior.
- **Missing assets/fonts:** list the gap and resolve licensing/availability before substituting. Respect the client's media-download rules.
- **Only web code returned:** specify the target framework, reuse repository components, and select the matching Code Connect label when available.

## Sources and validation

Setup checked against official documentation on 2026-10-08:
- [Figma remote setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Figma desktop setup](https://developers.figma.com/docs/figma-mcp-server/local-server-installation/)
- [Figma tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [OpenAI Codex MCP configuration](https://developers.openai.com/codex/mcp/)

Adapted from the seller-app's `figma-spec-harvest`, `figma-spec-harvester`, `figma-to-flutter`, `figma-to-implementation`, and `design-sync` workflows. No seller-app file IDs, business copy, or package paths are included. Live Figma extraction and per-platform compilation must be validated in users' connected projects; they were not run when authoring this guide.

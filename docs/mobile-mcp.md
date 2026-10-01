# Mobile MCP Integration

Mobile MCP is an MCP server for mobile automation across iOS and Android simulators, emulators, and real devices. It gives AI agents a platform-agnostic way to inspect screens, interact with apps, and run scripted QA flows.

Use it in Mobile AI Agents as the device automation layer for APPFORGE, QA, accessibility checks, and launch readiness.

---

## What Mobile MCP Provides

Mobile MCP supports:

- iOS real devices
- iOS simulators
- Android real devices
- Android emulators

It exposes tools for:

- Listing available devices
- Reading screen size and orientation
- Setting orientation
- Listing installed apps
- Installing, launching, terminating, and uninstalling apps
- Taking and saving screenshots
- Listing UI elements on screen
- Tapping, double tapping, long pressing, and swiping
- Typing text
- Pressing device buttons
- Opening URLs

---

## Install

### Automated setup

From an Android app project, run the environment doctor and configure your AI client:

```bash
npx mobile-ai-agents doctor --platform android
npx mobile-ai-agents mcp setup --client <claude|cursor|windsurf|codex>
npx mobile-ai-agents mcp config init --app-id com.example.app
```

The setup command preserves existing settings and is idempotent. The project config records the app ID, APK, target device, flow, timeouts, and evidence directory. See [Android Device QA Setup](android-device-setup.md) for the full command reference and troubleshooting.

### Manual setup

Standard MCP config:

```json
{
  "mcpServers": {
    "mobile-mcp": {
      "command": "npx",
      "args": ["-y", "@mobilenext/mobile-mcp@latest"]
    }
  }
}
```

Claude Code:

```bash
claude mcp add mobile-mcp -- npx -y @mobilenext/mobile-mcp@latest
```

Codex:

```bash
codex mcp add mobile-mcp npx "@mobilenext/mobile-mcp@latest"
```

Cursor:

Go to Cursor Settings -> MCP -> Add new MCP Server. Use command type:

```bash
npx -y @mobilenext/mobile-mcp@latest
```

Windsurf:

Add a new MCP server using command type:

```bash
npx @mobilenext/mobile-mcp@latest
```

---

## Mobile AI Agents Usage

### APPFORGE

Use Mobile MCP in APPFORGE Stage 7 Full QA:

```text
/mobile-mcp-qa
```

Then provide:

- Platform
- App package name or bundle ID
- Build path if needed
- Flow to test
- Expected result
- Edge cases

### UI Match Review

Use screenshots and element lists to compare implementation against the approved design:

- Layout
- Spacing
- Text
- Empty states
- Loading states
- Error states
- Accessibility labels

### Launch QA

Before store submission, use Mobile MCP to verify:

- First launch
- Main flow
- Offline behavior
- App restart
- Rotation
- Permission denial
- Crash-prone paths
- Store screenshot screens

---

## Example Prompt

```text
/mobile-mcp-qa
PLATFORM: Android
APP_ID: com.example.invoice
BUILD_PATH: app/build/outputs/apk/debug/app-debug.apk
FLOW:
1. Launch app.
2. Create a new invoice.
3. Save it.
4. Restart app.
5. Confirm invoice persists.
EXPECTED:
Invoice remains visible after restart with correct client, amount, due date, and status.
EDGE_CASES:
Rotate dashboard, enter invalid amount, deny notification permission.
```

---

## Recommended QA Evidence

For every important flow, save:

- Initial screen screenshot
- Form filled screenshot
- Success state screenshot
- Error state screenshot
- Restart or rotation screenshot
- Accessibility element list
- Bugs with exact repro steps

For auditable handoff, run the `device-proof-report` workflow after `/mobile-mcp-qa`. It produces `DEVICE_QA_REPORT.md` with build/install proof, screenshots, actions, assertions, crashes/logs, accessibility notes, pass/fail summary, and next fixes.

---

## Safety Rules

- Do not automate actions in third-party apps unless the user explicitly asks and owns the account/session.
- Do not submit real payments, ratings, reviews, or irreversible actions during QA.
- Prefer test accounts and sandbox builds.
- Record package names, device names, and build versions in every report.

---

## References

- Mobile MCP GitHub: https://github.com/mobile-next/mobile-mcp
- Mobile MCP package: https://www.npmjs.com/package/@mobilenext/mobile-mcp

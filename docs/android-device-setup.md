# Android Device QA Setup

Prepare an Android project for the `/mobile-mcp-qa` skill with repeatable environment checks, MCP configuration, and a project-level test definition.

This setup layer verifies prerequisites and records the intended QA flow. Device-flow execution is tracked separately in [issue #54](https://github.com/salmanashraf/mobile-ai-agents/issues/54).

## Prerequisites

- Node.js 18 or newer
- Android Studio with Android SDK Platform-Tools
- Android Emulator plus at least one AVD, or an authorized physical device
- Claude Code, Cursor, Windsurf, or Codex

## 1. Check the Android Environment

Run from the mobile app project:

```bash
npx mobile-ai-agents doctor --platform android
```

The doctor checks:

- `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and common SDK locations
- `adb` availability and version
- connected and authorized devices
- Android Emulator installation and configured AVDs
- Mobile MCP configuration for supported AI clients
- `.mobile-ai-agents/android-device.json` validity and APK availability

Use machine-readable output in CI or scripts:

```bash
npx mobile-ai-agents doctor --platform android --json
```

Exit code `1` means at least one required check failed. Warnings identify optional or not-yet-ready items, such as a missing APK before the first build.

## 2. Configure Mobile MCP

Choose the client you use:

```bash
npx mobile-ai-agents mcp setup --client claude
npx mobile-ai-agents mcp setup --client cursor
npx mobile-ai-agents mcp setup --client windsurf
npx mobile-ai-agents mcp setup --client codex
```

The command adds this server without deleting existing settings or MCP servers:

```json
{
  "command": "npx",
  "args": ["-y", "@mobilenext/mobile-mcp@latest"]
}
```

Running the same setup command again is safe and leaves an already-correct file unchanged.

Default configuration files:

| Client | File |
|---|---|
| Claude Code | `<project>/.mcp.json` |
| Cursor | `<project>/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Codex | `~/.codex/config.toml` |

Use `--config <path>` to target a different client config file.

## 3. Define the Project QA Flow

Create `.mobile-ai-agents/android-device.json`:

```bash
npx mobile-ai-agents mcp config init \
  --app-id com.example.app \
  --apk app/build/outputs/apk/debug/app-debug.apk \
  --device auto \
  --flow "Launch app|Open settings|Enable notifications|Restart app"
```

Generated shape:

```json
{
  "version": 1,
  "platform": "android",
  "appId": "com.example.app",
  "apkPath": "app/build/outputs/apk/debug/app-debug.apk",
  "device": "auto",
  "flow": [
    "Launch app",
    "Open settings",
    "Enable notifications",
    "Restart app"
  ],
  "timeouts": {
    "bootMs": 120000,
    "actionMs": 15000
  },
  "evidenceDir": ".mobile-ai-agents/evidence"
}
```

You can also copy [the configuration template](../templates/android-device-config.json).

Validate after editing:

```bash
npx mobile-ai-agents mcp config validate
npx mobile-ai-agents mcp config validate --json
```

## 4. Run the Skill

After the doctor has no failures, restart the AI client so it loads Mobile MCP, then invoke:

```text
/mobile-mcp-qa
```

The skill uses the app ID, build, target device, expected flow, and evidence requirements to guide device QA. See [Mobile MCP Integration](mobile-mcp.md) for the full prompt format and report output.

## Troubleshooting

| Result | Fix |
|---|---|
| Android SDK not found | Install the SDK and set `ANDROID_HOME` or `ANDROID_SDK_ROOT`. |
| `adb` not found | Install Platform-Tools and add `<sdk>/platform-tools` to `PATH`. |
| No ready device | Start an AVD or connect a device, enable USB debugging, and authorize the computer. |
| No AVD configured | Create one in Android Studio Device Manager. |
| MCP not configured | Run `mcp setup --client <client>`, then restart the client. |
| Invalid project config | Run `mcp config validate` and correct every listed field. |
| APK missing | Build the configured APK before device QA. |

Do not use production accounts or irreversible actions during automated QA. Prefer test builds, sandbox credentials, and disposable data.

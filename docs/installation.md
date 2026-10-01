# Installation Guide

This guide is for first-time users who want Mobile AI Agents installed in their AI coding tool without needing to understand the repo structure first.

---

## Quick Start

If you are starting from only an app idea, create the starter project docs first:

```bash
npx mobile-ai-agents start
```

It asks for your idea, platform, team, design status, monetization plan, and stack. Then it creates:

- `PRD.md`
- `DESIGN.md`
- `TASKS.md`
- `ROADMAP.md`
- `MOBILE_MEMORY.md`

If you already have a project and just want the AI tools installed, use the default install:

```bash
npx mobile-ai-agents install
```

This installs Mobile AI Agents for Claude Code. It adds agents, skills, and workflows as slash commands in:

```text
~/.claude/commands/
~/.claude/agents/
```

After install, open Claude Code in your app project and try:

```text
/mobile-harness
/flutter-review
/android-tdd
/crasher
```

---

## Before You Install

You need:

1. Node.js 18 or newer
2. An AI coding tool such as Claude Code, Cursor, Windsurf, GitHub Copilot, or Codex
3. A terminal opened in the project where you want the rules installed

Check Node.js:

```bash
node --version
```

If this prints a version like `v18.x`, `v20.x`, or newer, you are ready.

If you plan to use `/mobile-mcp-qa` with Android, also install Android Studio, Platform-Tools, and an emulator image or connect an authorized device. Verify the setup with:

```bash
npx mobile-ai-agents doctor --platform android
```

Then follow the [Android Device QA Setup guide](android-device-setup.md) to configure Mobile MCP and the project test flow.

---

## Step 1: Pick Your AI Tool

Choose the tool you use most often:

| I use... | Run this |
|---|---|
| Claude Code | `npx mobile-ai-agents install` |
| Cursor | `npx mobile-ai-agents install --tool cursor` |
| Windsurf | `npx mobile-ai-agents install --tool windsurf` |
| GitHub Copilot | `npx mobile-ai-agents install --tool copilot` |
| Codex / OpenAI | `npx mobile-ai-agents install --tool codex` |
| More than one tool | `npx mobile-ai-agents install --tool all` |

If you do not know which one to pick, start with the command for your editor. For example, Cursor users should use `--tool cursor`.

---

## Step 2: Run the Command From Your App Project

Open a terminal inside your mobile app project, not inside Mobile AI Agents.

Example:

```bash
cd ~/Code/my-flutter-app
npx mobile-ai-agents install --tool cursor
```

Why this matters:

- Cursor installs files into your current project under `.cursor/rules/`
- Windsurf installs `.windsurfrules` into your current project
- Copilot installs `.github/copilot-instructions.md` into your current project
- Codex installs `AGENTS.md` into your current project
- Claude Code installs globally into `~/.claude/`

---

## Step 3: Optionally Limit by Platform

By default, Mobile AI Agents installs all platforms:

- Android
- iOS
- Flutter
- React Native
- Unity / Unreal
- Cross-platform workflows

For a smaller install, choose one platform:

```bash
npx mobile-ai-agents install --platform android
npx mobile-ai-agents install --platform ios
npx mobile-ai-agents install --platform flutter
npx mobile-ai-agents install --platform rn
npx mobile-ai-agents install --platform gaming
```

You can combine platform and tool:

```bash
npx mobile-ai-agents install --platform flutter --tool cursor
npx mobile-ai-agents install --platform android --tool codex
npx mobile-ai-agents install --platform rn --tool all
```

---

## What Gets Installed

| Tool | Files created |
|---|---|
| Claude Code | `~/.claude/agents/*.md` and `~/.claude/commands/*.md` |
| Cursor | `.cursor/rules/*.mdc` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Codex / OpenAI | `AGENTS.md` |

The install command does not change your application source code. It only adds instruction files for your AI coding tool.

---

## Examples by Tool

### Claude Code

```bash
npx mobile-ai-agents install
```

Then open Claude Code and run a slash command:

```text
/crasher
```

Paste a crash log and ask for the root cause.

### Cursor

```bash
npx mobile-ai-agents install --tool cursor
```

Then use Cursor Chat:

```text
@axiom review this ViewModel
@flutter-review review this widget
```

### Windsurf

```bash
npx mobile-ai-agents install --tool windsurf
```

Windsurf reads `.windsurfrules` from your project. After install, ask Windsurf to use the relevant Mobile AI Agents agent or skill.

### GitHub Copilot

```bash
npx mobile-ai-agents install --tool copilot
```

Then use Copilot Chat with workspace context:

```text
@workspace Review this file using the Android code reviewer rules.
```

### Codex / OpenAI

```bash
npx mobile-ai-agents install --tool codex
```

This creates `AGENTS.md` in your project. Codex reads that file as project instructions when working in the repo.

---

## Local Clone Install

Use this if you cloned the Mobile AI Agents repo and want to install from local files instead of npm:

```bash
git clone https://github.com/salmanashraf/mobile-agency
cd mobile-agency
./install.sh --platform android
./install.sh --platform flutter --tool cursor
./install.sh --tool all
```

For most users, `npx mobile-ai-agents install` is simpler.

---

## Troubleshooting

### `npx: command not found`

Install Node.js from [nodejs.org](https://nodejs.org/) and reopen your terminal.

### `mobile-ai-agents: command not found`

Use the full `npx` command:

```bash
npx mobile-ai-agents install
```

### Cursor does not see the rules

Make sure the command created files under:

```text
.cursor/rules/
```

Then restart Cursor or reload the window.

### Codex does not follow the instructions

Make sure `AGENTS.md` exists at the root of the project you opened in Codex.

### I installed the wrong platform

Run the install command again with the platform you want:

```bash
npx mobile-ai-agents install --platform flutter --tool cursor
```

---

## Recommended First Commands

| Project type | Try first |
|---|---|
| Android | `/axiom` or `/compose-review` |
| iOS | `/swift-review` |
| Flutter | `/flutter-review` |
| React Native | `/rn-review` or `/perf-audit` |
| Unity / Unreal | `/game-perf` or `/blueprint-to-cpp` |
| Any app | `/crasher`, `/release-prep`, `/store-listing` |

---

## Wiki Version

If you maintain the GitHub Wiki, copy this page into a wiki page named:

```text
Installation
```

Suggested wiki URL:

```text
https://github.com/salmanashraf/mobile-agency/wiki/Installation
```

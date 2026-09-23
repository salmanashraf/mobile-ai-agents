# Getting Started

This guide walks you through using Mobile AI Agents for the first time.

---

## Choose a Loop First

Mobile AI Agents works best when you choose the engineering loop before choosing an agent.

If you are starting from a raw app idea, run this inside your project folder first:

```bash
npx mobile-ai-agents start
```

This creates `PRD.md`, `DESIGN.md`, `TASKS.md`, `ROADMAP.md`, and `MOBILE_MEMORY.md`. After reviewing those files, install the agents and run `/mobile-harness` to continue from the approved plan.

If this is your first mobile app or you do not know which stack to choose, start Mobile Harness like this:

```text
Use MOBILE-HARNESS in BEGINNER_GUIDED mode. I have a rough app idea and need a stack recommendation. Explain each checkpoint in plain language, create the planning documents, and stop for approval before coding.
```

APPFORGE is the planning specialist. Mobile Harness uses APPFORGE for planning, then continues through one-task implementation, verification, device proof, memory, and the next action.

| I need to... | Start with this loop | Good first tool |
|---|---|---|
| Plan an app or feature | Planning | `@APPFORGE` |
| Review architecture | Architecture | `@AXIOM` or `/clean-code-audit` |
| Build a feature | Development | `@MOBILE-HARNESS` |
| Fix slowness, ANRs, or leaks | Performance | `@PERF`, `@FREEZE`, `@RETAINER` |
| Audit production risk | Security | `@SENTINEL` or `/security-audit` |
| Prove the app works | Testing | `/mobile-mcp-qa` |
| Prepare a store release | Release | `/release-prep` |
| Improve store conversion | Growth | `@LAUNCHPAD` |
| Resume work or triage production issues | Maintenance | Mobile Memory or `@CRASHER` |

Then apply the platform plugin for your app: Android, iOS, Flutter, React Native, Kotlin Multiplatform, Unity, or Unreal.

Full model: [core-loops.md](core-loops.md)

---

## Prerequisites

You need one of:
- [Claude Code](https://claude.ai/code) (recommended)
- Any LLM chat interface (Claude.ai, ChatGPT, etc.)
- An LLM API client (for automation)

No installation required. All agents are plain Markdown files.

---

## Your First Agent: Android Code Review

### Step 1 — Open the agent file

```
agents/android/code-reviewer/agent.md
```

### Step 2 — Copy the System Prompt

Find the `## System Prompt` section and copy the text inside the code block.

### Step 3 — Start a new session

Paste the system prompt as your first message, or in Claude Code, paste it at the start of your session.

### Step 4 — Paste your input

Use the input format from `## Input Format`. Example:

```
PLATFORM: Android
KOTLIN_VERSION: 2.0
COMPOSE_VERSION: 1.7
FILE_PATH: app/src/main/java/com/example/MainViewModel.kt
CODE:
[paste your Kotlin file here]
```

### Step 5 — Review the output

The agent returns a structured report following the `## Output Format` spec. Every finding has a severity, location, and a concrete fix.

---

## Try It With the Example Files

Each agent has a matching example file in `examples/`. To see the agent in action:

1. Open `examples/android/ProfileViewModel.kt`
2. Paste its contents as the `CODE:` field
3. Run the Android Code Reviewer agent
4. Compare your output to the example in `agents/android/code-reviewer/agent.md`

---

## Using Skills (Lighter Weight)

Skills are simpler than full agents — a single prompt module you paste into any session.

```
# Quick session
# 1. Open: skills/android/code-review.md
# 2. Copy the Skill Prompt
# 3. Paste into your LLM session
# 4. Paste your Kotlin code and ask: "Review this for the issues listed above."
```

---

## Using Prompts (Lightest)

Prompts are standalone, single-purpose prompts in `prompts/`. They require no setup:

```
cat prompts/android/explain-flow.md
# Copy, paste into your LLM, add your code, done.
```

---

## Claude Code Workflow

If you use Claude Code, the fastest workflow is:

```bash
# Start Claude Code in your project directory
claude

# In the session, reference an agent:
# "Use the system prompt from agents/android/code-reviewer/agent.md to review this file:"
# Then paste your file contents.
```

Or drop the agent system prompt into a `CLAUDE.md` file in your project to prime every session automatically.

---

## Next Steps

- Browse `agents/` for the full list of agents
- Read [agent-guide.md](agent-guide.md) to understand how agents are structured
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) to add your own agent

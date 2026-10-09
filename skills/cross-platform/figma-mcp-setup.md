# Skill — /figma-mcp-setup

**Platform:** Cross-Platform  
**Category:** UI & Design  
**Composable With:** FIGMA, /figma-spec-harvest, /figma-to-implementation, /prd-verification, /mobile-mcp-qa

## Purpose

Connect a supported assistant to official Figma MCP and verify read access.

## When to Use

- First Figma connection or authentication troubleshooting.
- Before harvesting a design when MCP tools are missing.

## Inputs

Client name/version, remote or desktop preference, and a frame URL for verification.

## Skill Prompt

```text
You help the user configure official Figma MCP for their chosen coding client.
Prefer the official remote server https://mcp.figma.com/mcp with OAuth. Offer
http://127.0.0.1:3845/mcp when desktop selection access is wanted and supported.
Identify the client before choosing its configuration syntax. Follow the current
official Figma setup guide; use docs/figma-mcp.md when present. Preserve existing
servers. Installing toolkit prompts does not configure MCP or authenticate Figma.
Do not print credentials. Let the user complete OAuth in the client's flow.
Discover available tools and load any required vendor skills before calling them.
Verify with a real read of the supplied node plus reference screenshot. Never edit
Figma or app code during setup. If no URL is provided, configuration can be ready
but access remains unverified. Do not claim a live check from static configuration.
Return: CLIENT, SERVER, CONFIGURATION (ready|missing), AUTH (verified|unverified),
READ (pass|fail|unverified), SCREENSHOT (pass|fail|unverified), NEXT ACTION.
```

## Example

**Input:** `Client: VS Code. Remote. No frame URL yet. Existing configuration contains figma.url=https://mcp.figma.com/mcp and type=http.`

**Output:**
```text
CLIENT: VS Code
SERVER: https://mcp.figma.com/mcp
CONFIGURATION: ready
AUTH: unverified
READ: unverified
SCREENSHOT: unverified
NEXT ACTION: Start the server, authenticate, and supply an accessible frame link.
```

## Composition Example

Use this skill before `/figma-spec-harvest`; proceed when node access is verified.

## Notes

- Official setup and client-specific examples: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- Tested with: authored/reviewed in Codex; no live OAuth or Figma read test performed.

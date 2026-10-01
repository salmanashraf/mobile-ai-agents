# Release Process

Mobile AI Agents npm releases are published by GitHub Actions from git tags.

Do not run `npm publish` manually. Manual publishing can race with the tag workflow and cause npm to reject the workflow with:

```text
403 Forbidden - You cannot publish over the previously published versions
```

---

## Release Steps

1. If the release adds or renames an agent, skill, or workflow, update every install surface before changing the version:

```bash
# Required source file
agents/<platform>/<name>/agent.md
skills/<platform>/<name>.md
workflows/<name>.md

# Required CLI registry entries
cli/index.js
```

Checklist:

- Add the item to the matching `AGENTS`, `SKILLS`, or `WORKFLOWS` object in `cli/index.js`.
- Add cross-platform skills to every relevant `PLATFORM_SKILLS` bundle so `install --platform all`, Android, iOS, Flutter, React Native, and other platform installs include them.
- Add cross-platform agents to every relevant `PLATFORM_AGENTS` bundle when they should install with platform-specific setups.
- Update README/docs counts, command lists, wiki content, and install examples when totals or names change.
- Run `node cli/index.js list` and confirm the item appears under the expected section.
- Run an isolated install test and confirm the slash command file is created:

```bash
tmp_home="$(mktemp -d)"
HOME="$tmp_home" node cli/index.js install --platform all --tool claude
test -f "$tmp_home/.claude/commands/<name>.md"
```

2. Update `package.json`:

```json
{
  "version": "1.0.19"
}
```

3. Run local checks:

```bash
git diff --check
npm test
node --check cli/index.js
bash -n install.sh
node cli/index.js list
npm pack --dry-run
```

4. Commit the version bump:

```bash
git add package.json
git commit -m "Release v1.0.19"
```

If the release also changes docs, CLI, agents, skills, or workflows, include those files in the same release commit.

5. Create the tag locally:

```bash
git tag v1.0.19
```

6. Push the branch and tag:

```bash
git push origin main
git push origin v1.0.19
```

7. Let GitHub Actions publish npm and create the GitHub Release.

The workflow is `.github/workflows/publish.yml`. It runs on tags matching `v*`, verifies the tag version matches `package.json`, checks whether the version already exists on npm, and publishes only when the version is new. It also creates or updates the GitHub Release with generated notes.

Release notes must compare against the latest existing GitHub Release tag. The workflow passes that tag explicitly to GitHub's release-notes API so the `Full Changelog` range does not fall back to an older tag.

---

## Verification

After the workflow finishes:

```bash
npm view mobile-ai-agents version dist-tags.latest
npm view mobile-ai-agents@1.0.19 version dist.tarball dist.shasum
git ls-remote origin refs/heads/main refs/tags/v1.0.19
gh release view v1.0.19 --json body,url
```

Expected:

- npm latest equals the released version.
- GitHub `main` points to the release commit.
- GitHub tag `v1.0.19` points to the same release commit.
- GitHub Actions publish workflow is green.
- GitHub Release notes compare from the previous release tag to the new tag.
- New agents, skills, or workflows appear in `node cli/index.js list` and are installed by the matching `install` command.

---

## Important Rules

- Never run `npm publish` manually for normal releases.
- Never push a tag before `package.json` is updated and committed.
- The tag must match the package version exactly: `package.json` `1.0.19` uses tag `v1.0.19`.
- If a workflow is rerun for an already-published version, it should skip publishing instead of failing.
- Do not rely on GitHub's web UI default "Generate release notes" range. Use the workflow or pass the previous tag explicitly.
- Do not release a new agent, skill, or workflow until the CLI manifest and platform install bundles include it.

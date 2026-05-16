---
name: speckit-git-commit
description: Auto-commit changes after a Spec Kit command completes
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: github-spec-kit
  source: git:commands/speckit.git.commit.md
---

# Auto-Commit Changes

Automatically stage and commit all changes after a Spec Kit command completes, using an AI-generated commit message that describes the actual changes.

## Behavior

1. Determine the event name from the hook context (e.g., `after_specify`, `before_plan`, `after_implement`)
2. Check `.specify/extensions/git/git-config.yml` — look up `auto_commit.<event_name>.enabled`; fall back to `auto_commit.default`
3. If disabled or no changes exist, skip silently
4. If enabled: inspect the diff, generate a concise descriptive commit message, stage all changes, and commit

## Execution

### Step 1 — Check enablement

Run `git status --short` to detect uncommitted changes. If none, output "No changes to commit" and stop.

Check `.specify/extensions/git/git-config.yml` to confirm commits are enabled for this event (see Configuration below). If disabled, stop.

### Step 2 — Inspect changes

Run `git diff HEAD` (and `git diff --cached` if anything is already staged) to understand what changed. Also run `git status --short` for the file list.

### Step 3 — Generate commit message

Write a single-line commit message (≤72 chars) that concisely describes the actual changes. Rules:
- Use imperative mood ("add", "fix", "update", "remove")
- Be specific — name the files or concepts changed, not just the Spec Kit phase
- Prefix with `sk:` to identify it as a Spec Kit auto-commit
- Do NOT use the generic `message` field from git-config.yml — always derive from the diff

**Examples of good messages:**
- `sk: add confirmation dialog spec and clarifications`
- `sk: fix button-nesting in TaskItem, update plan constraints`
- `sk: add getCompletedOneTimeTasks query and Tasks page`
- `sk: implement repeated-task AlertDialog and undo confirmation`

### Step 4 — Stage and commit

```bash
git add .
git commit -m "<generated message>"
```

## Configuration

In `.specify/extensions/git/git-config.yml`:

```yaml
auto_commit:
  default: false          # Global toggle
  after_specify:
    enabled: true         # Override per-command (message field ignored)
  after_plan:
    enabled: true
```

## Graceful Degradation

- If Git is not available or not a repository: skip with a warning
- If no config file exists: skip (disabled by default)
- If no changes to commit: skip silently
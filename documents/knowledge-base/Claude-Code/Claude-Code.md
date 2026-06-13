# Claude Code — Major Features

## 1. Agentic Coding

Claude Code reads, edits, and creates files directly in your repo. You describe a task in plain English and it figures out which files to touch, makes the changes, and explains what it did.

**What you can do:**
- "Add a POST /messages route to the backend"
- "Refactor this component to use a custom hook"
- "Fix the bug where login fails when the email has uppercase letters"

---

## 2. Slash Commands

Built-in commands typed at the prompt that trigger specific actions.

| Command | What it does |
| --- | --- |
| `/init` | Generate a `CLAUDE.md` for your repo |
| `/review` | Review the current branch as if it were a PR |
| `/security-review` | Audit pending changes for security issues |
| `/compact` | Compress conversation history to save context |
| `/config` | Open settings (model, theme, voice language, etc.) |
| `/cost` | Show token usage and cost for the session |
| `/status` | Show MCP server connection status |
| `/doctor` | Run environment diagnostics |
| `/clear` | Clear the current conversation |
| `/voice` | Toggle voice mode (hold Space to record) |
| `/help` | List all available commands |

---

## 3. Voice Mode

Lets you speak your prompts instead of typing them.

**How to use:**
1. Type `/voice` to enable — it toggles on/off each time
2. Hold `Space` to record, release to submit
3. Change the dictation language in `/config`

---

## 4. Inline Shell Commands

Prefix any shell command with `!` to run it directly in the conversation. The output is returned to Claude so it can act on the result.

```
! git status
! npm run test
! npx prisma studio
```

Useful for running tests, checking logs, or triggering builds without leaving the chat.

---

## 5. Subagents

Claude Code can spawn specialized agents to handle focused tasks in parallel, keeping the main conversation context clean.

| Agent | Best for |
| --- | --- |
| `Explore` | Fast read-only searches — "where is X defined?" |
| `Plan` | Designing an implementation strategy before writing code |
| `general-purpose` | Multi-step research across the codebase |
| `claude-code-guide` | Questions about Claude Code itself or the Anthropic API |

Agents run in the background and report back when done. Open `/agents` to manage them.

---

## 6. CLAUDE.md — Project Instructions

A markdown file at the repo root (or in subdirectories) that gives Claude persistent instructions for the project — commands to run, architecture notes, conventions to follow.

**What to put in it:**
- How to start the dev server, run tests, run migrations
- Architecture overview (which folders do what)
- Conventions (naming, file structure, libraries to use)
- Things Claude should never do (e.g., "don't mock the database in tests")

Claude reads this file automatically at the start of every session.

---

## 7. Memory

Claude Code can save facts across sessions to a persistent memory store. Useful for things that aren't obvious from the code — your role, preferences, project context, or feedback on how to collaborate.

**Examples of what gets remembered:**
- "I'm new to React but experienced in Go"
- "Always use real DB in tests, never mocks"
- "The auth rewrite is driven by a compliance requirement"

---

## 8. MCP Servers (Model Context Protocol)

MCP servers extend Claude Code with external tool integrations — databases, APIs, services. Once connected, Claude can call those tools as naturally as it calls built-in ones.

**Common integrations:**
- GitHub (read issues, create PRs)
- Postgres (query the DB directly)
- Slack, Linear, Jira

Check active connections with `/status`.

---

## 9. Task Tracking

Claude Code can break work into discrete tasks and track progress internally during a session. Useful for multi-step features where you want to follow along with what's done and what's next.

---

## 10. Scheduled Agents (`/schedule`)

Run a Claude Code agent on a cron schedule — for recurring tasks like nightly audits, daily summaries, or periodic checks. Use the `/schedule` skill to set it up.

---

## 11. IDE Integration

Claude Code integrates with VS Code and JetBrains. Diagnostics, file context, and open-editor state flow into the conversation automatically, so Claude knows what you're looking at.

---

## 12. CLI Flags

Useful when scripting or launching from the terminal:

| Flag | What it does |
| --- | --- |
| `claude -p "prompt"` | One-shot non-interactive run |
| `claude --continue` | Resume the most recent conversation |
| `claude --resume <id>` | Resume a specific session |
| `claude --cwd ./backend` | Start in a different directory |
| `claude --print -p "..."` | Print response and exit (for scripts) |

---

## 13. Modes

You get to select Claude Code Modes suitable for your needs.

There modes are currently available:

- [Link](https://code.claude.com/docs/en/permission-modes#available-modes)
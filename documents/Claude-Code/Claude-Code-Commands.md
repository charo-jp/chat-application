## Claude Code Commands

### Slash commands (type inside the Claude Code prompt)

- Initialize a CLAUDE.md for the current repo

  > /init

- Review the current branch's changes as a pull request

  > /review

- Run a security review on pending branch changes

  > /security-review

- Show all available slash commands and help

  > /help

- Clear the current conversation context

  > /clear

- Compact the conversation to save context space

  > /compact

- Open settings (model, theme, etc.)

  > /config

- Show token usage and cost for the current session

  > /cost

- Show connection status and available MCP servers

  > /status

- Run diagnostics to check Claude Code's environment

  > /doctor

- Exit Claude Code

  > /quit

- Initiate Voice Mode
  > /voice

- Start a new session 
  > /reset

- 
  > /plan

---

### Running shell commands inline

- Prefix any shell command with `!` to run it directly in the conversation

  > ! git status
  > ! npm run test
  > ! npx prisma studio

  The output lands directly in the conversation so Claude can read it.

---

### CLI flags (when launching `claude` from the terminal)

- Start with a one-shot prompt (non-interactive)

  > claude -p "explain the users route"

- Start in a different directory

  > claude --cwd ./backend

- Print the response and exit (useful in scripts)

  > claude --print -p "summarize this file" < src/index.ts

- Continue the most recent conversation

  > claude --continue

- Resume a specific conversation by session ID

  > claude --resume <session-id>

---

### Agents

Agents are specialized subagents Claude Code can spawn to handle focused tasks in parallel or in isolation.

- Open the agents panel to view and manage running agents

  > /agents

- Available built-in agent types:

| Agent               | Purpose                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `claude`            | General-purpose catch-all for any task                                                                                   |
| `Explore`           | Fast read-only search — find files, grep symbols, locate definitions. Use for "where is X?" questions, not deep analysis |
| `Plan`              | Designs implementation plans, identifies critical files, considers trade-offs before writing any code                    |
| `general-purpose`   | Multi-step research, complex searches across the codebase                                                                |
| `claude-code-guide` | Answers questions about Claude Code CLI, Claude API, and the Agent SDK                                                   |
| `statusline-setup`  | Configures the Claude Code status line setting                                                                           |

- Agents run in the background and report back when done, keeping the main conversation context clean.
- Use `Explore` for quick lookups; use `general-purpose` when you're not sure where to find something and expect several search attempts.

---

### Keyboard shortcuts (inside the interactive session)

| Shortcut        | Action                              |
| --------------- | ----------------------------------- |
| `Ctrl + C`      | Cancel current response             |
| `Ctrl + L`      | Clear screen                        |
| `↑` / `↓`       | Navigate prompt history             |
| `Shift + Enter` | Insert a newline without submitting |

## More Tips Found on These Websites

- https://github.com/ykdojo/claude-code-tips

-

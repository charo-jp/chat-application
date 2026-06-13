# Logging Strategy

## General Rules

- **Never log sensitive data**: passwords, tokens, raw JWT payloads, or full request bodies that may contain credentials.
- **Be selective.** Not every operation needs a log line. Log meaningful events — failures, security-relevant actions, and state changes that you'd want to reconstruct later. Noisy logs hide the signal and cost money to store.
- Always include enough context to identify _where_ the problem occurred (URL, method) and _who_ was affected (user ID, email — never password).
- Prefer the request-scoped logger (`request.log`) inside route handlers over `server.log`. Fastify attaches a request ID to it, so all logs for one request are correlated automatically.

## Choosing a Log Level

Pick the level by asking "what does this mean for the system?" — not by the specific endpoint. This keeps the strategy stable as the API grows.

| Level   | Use when…                                                                          | Examples                                                                                 |
| ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `fatal` | The application cannot continue and is shutting down.                              | Can't connect to the database on startup, can't bind to the port.                        |
| `error` | An unexpected failure occurred, but the server keeps running. Needs investigation. | Unhandled exceptions, unexpected Prisma errors, validation errors that shouldn't happen. |
| `warn`  | Something abnormal but expected and handled. Worth watching if frequent.           | Failed login attempt, rate limit triggered, deprecated usage.                            |
| `info`  | A normal, significant event in the system's lifecycle.                             | Server started, user logged in, migration applied.                                       |
| `debug` | Detailed diagnostic info, development only.                                        | Variable values, branch decisions while tracing a bug.                                   |
| `trace` | Extremely verbose, rarely used.                                                    | Per-iteration loop details.                                                              |

Rule of thumb: if it requires a human to act → `error`/`fatal`. If it's an event worth noticing but not acting on → `warn`/`info`. If it only helps while debugging → `debug`/`trace`.

## Example: Error Handler (index.ts)

```ts
server.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    request.log.warn(
      `Validation Error in ${request.method}: ${request.url}, message: ${error.validation}`,
    );
    return reply.status(400).send({ error: error.validation });
  } else {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});
```

## Never Do This

```ts
// BAD — exposes password in logs
server.log.error({ email, password }, "Login failed");

// BAD — may expose token
server.log.info({ token }, "Login successful");
```

## Implemented Practices

1. **Automatic redaction.** Pino strips sensitive fields globally via the `redact` option in `index.ts`, so a stray `password` or `authorization` header is scrubbed even if someone logs the whole object:

   ```ts
   const server = fastify({
     logger: {
       redact: ["req.headers.authorization", "*.password", "*.token"],
     },
   });
   ```

2. **Structured JSON in production.** `pino-pretty` is only enabled in development. In production, raw JSON is emitted for log aggregators:

   ```ts
   const server = fastify({
     logger: {
       redact: [...],
       ...(isProduction ? {} : { transport: { target: "pino-pretty" } }),
     },
   });
   ```

## TODO

3. **Configurable log level by environment.** Set the logger `level` from an env var — `debug` in development, `info` in production — so verbose logs don't ship to prod. Wire this through `config.ts`.

---
paths: [backend/routes/**]
---

## General Rules
- If an endpoint does more than one thing, break it into multiple functions and call those in the endpoint function.
- Functions being broken into should not be in the same file. Put them in `backend/services/` in a file named after the domain (e.g. `backend/services/auth.ts`, `backend/services/users.ts`).
- If a helper function is general-purpose and could be used across multiple domains, put it in `backend/utils/` instead.

## Handler conventions
- Name handlers `{verb}{Entity}Handler` (e.g. `loginHandler`, `getMyUserInfoHandler`).
- Export as a named `const` arrow function with explicit parameter and return types.
- Return type: `Promise<ResponseType | void>`.
- First line must log the call with a structured object: `request.log.info({ userId: id }, "handlerName called")`.
- Log again when a resource is found: `request.log.info({ userId: user.id }, "handler found resource")`.

## Route plugin conventions
- Name the plugin `async function {domain}Routes(server: FastifyInstance)`.
- Apply auth with `server.addHook("preHandler", server.authenticate)` — not per-route.
- File layout — two sections separated by comment dividers:
  ```
  // API Definitions------------------------------------------------------
  // Routes Definitions------------------------------------------------------
  ```

## Errors
- Let the global error handler catch unexpected errors by default — no try/catch needed for general cases.
- Use try/catch only when a specific error code needs different handling (e.g. Prisma P2025).
- Always send errors as `{ error: "message" }` — never bare strings or nested objects.
- On early error exit: log with `request.log.error(...)`, then `reply.status(code).send({ error: message })` and `return`.

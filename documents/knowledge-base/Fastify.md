
npx tsc --noEmit

## Request & Response Lifecycle

Every incoming request in Fastify passes through a fixed sequence of hooks before the route handler runs, and another sequence after it replies. Understanding this order is important when adding auth, logging, validation, or error handling.

```
Incoming Request
       │
       ▼
  onRequest        ← earliest hook; runs before body is parsed (good for rate limiting)
       │
       ▼
  preParsing       ← can modify the raw request stream before body parsing
       │
       ▼
  (body parsing)   ← Fastify parses JSON / form data here
       │
       ▼
  preValidation    ← runs before JSON Schema validation
       │
       ▼
  (validation)     ← Fastify validates params, query, body, headers against schema
       │
       ▼
  preHandler       ← runs after validation; ideal for auth checks (e.g. server.authenticate)
       │
       ▼
  Route Handler    ← your actual handler function
       │
       ▼
  preSerialization ← can transform the response payload before serialization
       │
       ▼
  (serialization)  ← Fastify serializes the response to JSON
       │
       ▼
  onSend           ← last chance to modify the response before it is sent
       │
       ▼
  onResponse       ← runs after the response is sent (good for logging)
```

### Why `preHandler` for authentication

`server.authenticate` is added as a `preHandler` hook because:
- The request body has already been parsed and validated at that point
- If the token is invalid, Fastify short-circuits and never calls the route handler
- `request.user` is populated here, so the handler can safely read it

### Hook scope

Hooks registered with `server.addHook(...)` inside a plugin apply only to routes in that plugin's scope. Wrapping a plugin with `fastify-plugin` (fp) promotes it to the parent scope, making the hook global.

```ts
// Applies only to routes registered in userRoutes
export async function userRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);
  server.get("/me", getMyUserInfoHandler);   // ← protected
  server.get("/:id", getOtherUserInfoHandler); // ← protected
}
```

### Error handling hook

If any hook or handler throws, Fastify jumps directly to the error handler (`server.setErrorHandler`), skipping the remaining lifecycle hooks.

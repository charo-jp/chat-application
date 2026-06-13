# Cyber Security

## Authentication

### Timing Attack Prevention

A timing attack on login exploits the fact that `bcrypt.compare` is slow — if you skip it when the user isn't found, the response returns noticeably faster, leaking whether an email is registered.

**Fix:** Always run `bcrypt.compare`, even when the user doesn't exist, by passing a hardcoded dummy hash:

```ts
const isCorrectPassword = await bcrypt.compare(
  password,
  user ? user.password : BCRYPT_TIMING_DUMMY,
);
if (!user || !isCorrectPassword) {
  return reply.status(401).send({ error: "Invalid credentials" });
}
```

`BCRYPT_TIMING_DUMMY` is a pre-generated bcrypt hash in `config.ts`. It never matches any real password — it exists only to keep response time constant.

### httpOnly Cookies (XSS Protection)

Tokens are stored in `httpOnly` cookies so they cannot be read by JavaScript. Even if an attacker injects a script into the page, `document.cookie` will not expose the tokens.

### sameSite: "strict" (CSRF Protection)

Both cookies use `sameSite: "strict"`, which tells the browser to never send the cookie on cross-site requests. This prevents Cross-Site Request Forgery attacks where a malicious site tricks the browser into making authenticated requests.

### Token Scope via Cookie Path

The refresh token cookie is scoped to `path: "/auth/refresh"` so the browser only attaches it when calling the refresh endpoint — it is not sent with regular API calls, reducing its exposure.

### Rate Limiting on Login

The `POST /auth/login` endpoint is rate-limited to 5 requests per minute per IP via `@fastify/rate-limit`. Clients that exceed the limit twice are banned. This slows down credential stuffing and brute-force attacks.

### Credential Redaction in Logs

Pino's `redact` option in `index.ts` strips `authorization` headers, `password`, and `token` fields from all log output, so secrets never appear in logs even if an object is accidentally logged in full.

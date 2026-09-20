# Signing in

A password was the whole of it. One factor, on accounts that reach payroll, contracts, the
compliance registers and every employee's screenshots — and the only way to revoke anything
was `tokenVersion`, which retires _every_ token a person holds. Losing a laptop meant
signing out of every browser and every tracker device, or doing nothing at all.

## What a sign-in produces now

```
login(email, password)
   │
   ├── two-factor off ─────────────────────────► session token + user
   │                                             (a Session row is written)
   └── two-factor on  ─────────────────────────► mfaRequired, mfaChallenge
                                                  │
                                    verifyMfa(challenge, code)
                                                  │
                                                  ▼
                                          session token + user
```

Both outcomes come back from one mutation, and the challenge path carries **nothing** about
the account. A client cannot discover from the answer whether two-factor is on for an
address, because that would be a way to find out who has protected their account and who
has not.

The challenge is a five-minute JWT with its own audience (`portal-mfa`), so it can never be
presented as a session: knowing the password is exactly half of what is required.

## Two-factor is TOTP, written out

`utils/totp.ts` implements RFC 6238 in about thirty lines of HMAC. That is deliberate: a
dependency here would sit directly on the sign-in path, for code shorter than its own
README, and every authenticator app in the world already agrees on the parameters. The
suite checks it against the RFC's own test vector.

- **Secret** — 160 bits, base32, sealed with the existing secret box (`utils/secretBox`).
  Sealed rather than hashed because checking a code means computing it.
- **Drift** — one 30-second step either side, so a code typed as it rolls over still works
  and a phone whose clock is half a minute out still works. Wider would extend the life of a
  code somebody shoulder-surfed.
- **Recovery codes** — ten, hashed with SHA-256 (they are only ever compared, never
  recomputed), shown once, and **spent the moment one works**. A list somebody photographed
  is worth less every time it is used.
- **Switching on** needs a code, because that is the only proof the secret reached the app —
  turning it on without one is how somebody locks themselves out by scanning nothing.
- **Switching off** needs the password, because a borrowed screen must not be enough.

Wrong codes count against the same per-address and per-IP limits a wrong password does, so
six digits cannot be worked through at leisure.

## Sessions

Every sign-in writes a `Session` row, and the token carries its id as `sid`. The request
context checks the session still stands on every request — one indexed read next to the user
read it already does.

**Account settings** lists them: what the browser called itself, where it signed in from,
when it was last seen, and which one is this one. From there a person can end one session or
end every other one.

- The token itself is never stored, not even hashed. The row's only job is to say whether
  that session still stands.
- `lastSeenAt` is updated at most every five minutes. This is "last seen roughly", for a
  human reading a list, not an access log — and a read-only query should not become a write.
- Setting a password ends every session. That is folded into `bumpTokenVersion`, so no
  caller of it can forget: a revoked token whose session row still reads as live looks, to
  the person reading their own list, like somebody else is still in their account.
- Tokens issued before sessions existed carry no `sid` and keep working until they expire —
  seven days at the outside.

Tracker **devices** are separate and unchanged: a device token never expires and is revoked
through its device row, which is what lets a lost laptop be cut off without signing anybody
else out.

## What is still a password only

- Tracker desktop and phone sign-in.
- Single sign-on of any kind: there is no OIDC, no SAML, no SCIM.
- Passkeys.
- A configurable password policy (length is enforced; expiry and history are not).

## Where to look

| File                                 | What it is                                            |
| ------------------------------------ | ----------------------------------------------------- |
| `utils/totp.ts`                      | RFC 6238, and the `otpauth://` URI a QR code carries. |
| `modules/auth/mfa.service.ts`        | Enrolment, the second factor, recovery codes.         |
| `modules/auth/session.model.ts`      | One row per sign-in.                                  |
| `modules/auth/session.service.ts`    | Start, check, list, revoke.                           |
| `middleware/auth.ts`                 | Where a request's session is checked.                 |
| `packages/login/src/Login/forms/mfa` | The second step of the sign-in screen.                |
| `packages/shell/src/pages/Settings`  | Two-factor and the session list.                      |

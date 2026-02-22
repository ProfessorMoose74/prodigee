# Auth Service

Handles all authentication and user management for the Prodigee platform.

## Responsibilities

- Parent account registration and login
- COPPA-compliant child account management (parental consent required)
- JWT token issuance and validation
- Role-based access control (parent, child, teacher, admin)
- Session management with age-based duration limits
- Token blacklisting for secure logout

## API Endpoints

### Parent
- `POST /parent/register` — Create parent account
- `POST /parent/login` — Parent login, returns JWT
- `POST /parent/add_child` — Add child to parent account

### Child (COPPA-Compliant)
- `POST /child/login` — Child login (requires parent token + child_id)

### Session
- `POST /logout` — Invalidate token

## COPPA Compliance

- Children cannot self-register — requires parent token
- Child tokens expire after 4 hours (configurable by age group)
- Age-based session limits: 30 min (3-5), 45 min (6-8), 60 min (9+)
- No child email or real name stored — display name only
- Voice interaction data: text transcripts only, no audio retention

## Token Structure

```
Algorithm: HS256
Parent token expiry: 24 hours
Child token expiry: 4 hours

Claims: {
  id: str,         # User UUID
  type: str,       # "parent" | "child"
  parent_id: str,  # (child tokens only)
  exp: int,
  iat: int
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_JWT_SECRET` | — | JWT signing secret (required in production) |
| `AUTH_JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `AUTH_PARENT_TOKEN_EXPIRY_HOURS` | `24` | Parent token lifetime |
| `AUTH_CHILD_TOKEN_EXPIRY_HOURS` | `4` | Child token lifetime |
| `AUTH_COPPA_ENABLED` | `true` | Enforce COPPA rules |
| `AUTH_CHILD_SESSION_LIMIT_MINUTES_3_5` | `30` | Session limit ages 3-5 |
| `AUTH_CHILD_SESSION_LIMIT_MINUTES_6_8` | `45` | Session limit ages 6-8 |
| `AUTH_CHILD_SESSION_LIMIT_MINUTES_9_PLUS` | `60` | Session limit ages 9+ |

## Firestore Collections

- `parents` — Parent account documents
- `children` — Child account documents
- `token_blacklist` — Invalidated JWT tokens

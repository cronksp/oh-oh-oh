# Admin & Logging

## Admin Dashboard
Access: `/admin` (Requires `admin` role).

### Features
- **User List**: View all registered users.
- **User Management**: Delete users (soft delete or hard delete depending on implementation).

## Logging
We use `pino` for structured logging.

### Log Levels
- `info`: General application flow (startup, login, etc.).
- `error`: Exceptions and critical failures.
- `warn`: Deprecations or non-critical issues.

### Log Output
- **Development**: Pretty-printed to console.
- **Production**: JSON format to stdout (can be piped to log collectors like Datadog, CloudWatch, etc.).

### Sensitive Data
Logs **MUST NOT** contain:
- Passwords
- Encryption Keys
- Private Event Details (decrypted)

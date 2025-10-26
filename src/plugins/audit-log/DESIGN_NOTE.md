# Design summary — Audit Logging plugin (audit-log)

## Goals
- Capture create/update/delete events across all content types
- Store metadata (user, action, timestamp, diff)
- Provide REST API with filtering & pagination
- Role-based access control via a read_audit_logs permission flag
- Configurable (enable/disable, exclude content types)

## Architecture
- Implemented as a Strapi plugin (src/plugins/audit-log).
- On bootstrap, subscribes to Strapi DB lifecycles for each content type via strapi.db.lifecycles.subscribe.
- Logs are persisted into a new content-type `plugin::audit-log.audit-log`.
- Exposed REST route `GET /audit-logs` protected with a custom policy.

## Implementation notes
- We compute diffs for updates using a shallow equality check and store JSON in `changed`.
- We attempt to extract user from `ctx.state.user` (users-permissions) or `event.params`.
- Errors in logging are swallowed (logged) to avoid breaking the main request flow.
- DB indexes recommended on (contentType, recordId), user, timestamp.

## Limitations & future improvements
- Role -> permission mapping uses a simple role flag. Better integration with users-permissions actions for granular RBAC is recommended.
- For very high throughput, move logging to background queue or separate store.
- Use a robust diff algorithm for nested objects if needed.

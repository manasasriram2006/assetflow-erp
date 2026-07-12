# Architecture

AssetFlow follows a modular client/server architecture designed so multiple developers can work independently.

## Backend

Routes are intentionally thin and only compose middleware, validation, authorization, and controllers.

Controllers translate HTTP requests into service calls.

Services contain business rules:

- `asset.service.js`: tag generation, asset status rules
- `workflow.service.js`: allocation, return, transfer, booking, maintenance, audit workflows
- `report.service.js`: dashboard aggregates and CSV export
- `crud.service.js`: shared normalized CRUD behavior

Middleware handles cross-cutting concerns:

- JWT authentication
- role authorization
- request validation
- sanitization
- centralized errors
- security headers and rate limiting

## Frontend

The client is organized by reusable infrastructure and business pages:

- `components`: buttons, inputs, tables, page headers, stat cards
- `context`: auth session state
- `hooks`: shared API loading state
- `layouts`: ERP shell with sidebar and navbar
- `pages`: module screens
- `services`: Axios API clients

The first authenticated screen is the operational dashboard, not a landing page.

## Database

The Prisma schema normalizes users, departments, categories, assets, workflow history, audit records, and notifications. Foreign keys preserve module relationships and history tables avoid overwriting operational records.

## Review Summary

### Strengths

- Clear separation of frontend, API, service, validation, and persistence layers.
- Workflow-heavy business logic is implemented in services rather than directly in route handlers.
- Database constraints protect important invariants such as unique asset tags and one active allocation per asset.
- The UI is an operational ERP shell with dashboard, directory, workflow, report, and notification views.

### Critical Risks Addressed

- Production startup now fails if database URL, client origin, or strong JWT secrets are missing.
- CORS is now explicit and supports a comma-separated allow-list for deployed environments.
- Rate limiting is configurable through environment variables.
- JWT middleware now validates access-token payload shape consistently.
- Missing submission docs were generated for API, ERD, and improvement review.

### Remaining Production Improvements

- Persist refresh-token identifiers or user token versions for server-side logout and revocation.
- Move uploaded files from local disk to private object storage with signed access URLs.
- Add integration tests around allocation, transfer approval, booking overlap, maintenance transitions, and audit closure.
- Add department-scoped access rules for department heads if multi-department privacy is required.
- Move scheduled state changes such as booking completion and overdue allocation checks to a background worker.

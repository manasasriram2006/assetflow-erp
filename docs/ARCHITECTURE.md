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

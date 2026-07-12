# API Documentation

Base URL: `http://localhost:5000`

All protected endpoints require:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Responses are JSON unless an endpoint explicitly returns CSV. Validation failures return `400`, unauthenticated requests return `401`, authorization failures return `403`, missing records return `404`, business-rule conflicts return `409`, and unexpected failures return `500`.

## Health

| Method | Path      | Auth | Purpose              |
| ------ | --------- | ---- | -------------------- |
| `GET`  | `/health` | No   | Service health check |

## Authentication

| Method  | Path                    | Auth | Body                                       | Purpose                                    |
| ------- | ----------------------- | ---- | ------------------------------------------ | ------------------------------------------ |
| `POST`  | `/auth/signup`          | No   | `{ name, email, password, departmentId? }` | Register an employee account               |
| `POST`  | `/auth/login`           | No   | `{ email, password }`                      | Return `user`, `token`, and `refreshToken` |
| `POST`  | `/auth/refresh`         | No   | `{ refreshToken }`                         | Rotate access and refresh tokens           |
| `POST`  | `/auth/forgot-password` | No   | `{ email }`                                | Safe reset acknowledgement                 |
| `POST`  | `/auth/logout`          | Yes  | None                                       | End current client session                 |
| `GET`   | `/auth/me`              | Yes  | None                                       | Current user profile                       |
| `PATCH` | `/auth/profile`         | Yes  | `{ name, departmentId? }`                  | Update current profile                     |

## Users

Roles: `ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, `EMPLOYEE`.

| Method  | Path                    | Roles                           | Purpose                                                                     |
| ------- | ----------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `GET`   | `/users`                | Admin, manager, department head | List users with `page`, `limit`, `search`, `status`, `role`, `departmentId` |
| `GET`   | `/users/:id`            | Admin, manager, department head | Get user                                                                    |
| `POST`  | `/users`                | Admin                           | Create user                                                                 |
| `PUT`   | `/users/:id`            | Admin                           | Update user                                                                 |
| `PATCH` | `/users/:id/role`       | Admin                           | Promote or demote role                                                      |
| `PATCH` | `/users/:id/activate`   | Admin                           | Restore soft-deleted user                                                   |
| `PATCH` | `/users/:id/deactivate` | Admin                           | Soft delete user                                                            |

## Organization

| Method  | Path                          | Roles                | Purpose                |
| ------- | ----------------------------- | -------------------- | ---------------------- |
| `GET`   | `/departments`                | Any authenticated    | List departments       |
| `GET`   | `/departments/:id`            | Any authenticated    | Get department         |
| `POST`  | `/departments`                | Admin                | Create department      |
| `PUT`   | `/departments/:id`            | Admin                | Update department      |
| `PATCH` | `/departments/:id/head`       | Admin                | Assign department head |
| `PATCH` | `/departments/:id/activate`   | Admin                | Restore department     |
| `PATCH` | `/departments/:id/deactivate` | Admin                | Soft delete department |
| `GET`   | `/categories`                 | Any authenticated    | List asset categories  |
| `POST`  | `/categories`                 | Admin, asset manager | Create category        |
| `PUT`   | `/categories/:id`             | Admin, asset manager | Update category        |
| `PATCH` | `/categories/:id/activate`    | Admin, asset manager | Restore category       |
| `PATCH` | `/categories/:id/deactivate`  | Admin, asset manager | Soft delete category   |

## Assets

Asset statuses: `AVAILABLE`, `ALLOCATED`, `RESERVED`, `MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED`.

| Method   | Path                  | Roles                | Purpose                                                           |
| -------- | --------------------- | -------------------- | ----------------------------------------------------------------- |
| `GET`    | `/assets`             | Any authenticated    | List assets with pagination, search, status, category, department |
| `GET`    | `/assets/:id`         | Any authenticated    | Get asset with category, department, and history                  |
| `GET`    | `/assets/:id/history` | Any authenticated    | Get asset event history                                           |
| `POST`   | `/assets`             | Admin, asset manager | Register asset and generate asset tag                             |
| `PUT`    | `/assets/:id`         | Admin, asset manager | Update asset                                                      |
| `POST`   | `/assets/:id/photo`   | Admin, asset manager | Upload base64 PNG/JPG/WEBP under 5 MB                             |
| `DELETE` | `/assets/:id`         | Admin, asset manager | Soft delete asset when no active workflow exists                  |

Example asset create:

```json
{
  "name": "Dell Latitude 7450",
  "serialNo": "DL-7450-001",
  "value": 1250,
  "purchaseDate": "2026-07-01",
  "location": "Bengaluru HQ",
  "categoryId": "uuid",
  "departmentId": "uuid"
}
```

## Allocation And Transfer

| Method | Path                      | Roles                           | Purpose                             |
| ------ | ------------------------- | ------------------------------- | ----------------------------------- |
| `GET`  | `/allocations`            | Admin, manager, department head | List allocations                    |
| `GET`  | `/allocations/history`    | Admin, manager, department head | Allocation and transfer history     |
| `POST` | `/allocations`            | Admin, asset manager            | Allocate an available asset         |
| `POST` | `/allocations/:id/return` | Admin, asset manager            | Return active allocation            |
| `GET`  | `/transfers`              | Any authenticated               | List transfers                      |
| `POST` | `/transfers`              | Any authenticated               | Request transfer of allocated asset |
| `POST` | `/transfers/:id/approve`  | Admin, manager, department head | Approve transfer                    |
| `POST` | `/transfers/:id/reject`   | Admin, manager, department head | Reject transfer                     |

## Booking

| Method | Path                   | Roles                           | Purpose                                 |
| ------ | ---------------------- | ------------------------------- | --------------------------------------- |
| `GET`  | `/bookings`            | Any authenticated               | List bookings by `status`, `from`, `to` |
| `POST` | `/bookings`            | Any authenticated               | Create non-overlapping booking          |
| `POST` | `/bookings/:id/cancel` | Any authenticated               | Cancel upcoming or ongoing booking      |
| `POST` | `/bookings/reminders`  | Admin, manager, department head | Send 24-hour booking reminders          |

## Maintenance

| Method  | Path                           | Roles                | Purpose                                       |
| ------- | ------------------------------ | -------------------- | --------------------------------------------- |
| `GET`   | `/maintenance`                 | Any authenticated    | List requests                                 |
| `GET`   | `/maintenance/history`         | Any authenticated    | Maintenance event history                     |
| `POST`  | `/maintenance`                 | Any authenticated    | Request maintenance                           |
| `PATCH` | `/maintenance/:id/status`      | Admin, asset manager | Approve, reject, progress, or resolve         |
| `PATCH` | `/maintenance/:id/technician`  | Admin, asset manager | Assign technician                             |
| `POST`  | `/maintenance/:id/attachments` | Any authenticated    | Upload base64 PNG/JPG/WEBP/PDF/TXT under 5 MB |

## Audit

| Method  | Path                        | Roles                           | Purpose                                  |
| ------- | --------------------------- | ------------------------------- | ---------------------------------------- |
| `GET`   | `/audits`                   | Admin, manager, department head | List audit cycles                        |
| `GET`   | `/audits/history`           | Admin, manager, department head | Audit event history                      |
| `POST`  | `/audits`                   | Admin, manager, department head | Create audit cycle with asset items      |
| `GET`   | `/audits/:id/discrepancies` | Admin, manager, department head | Missing/damaged report                   |
| `PATCH` | `/audits/items/:id/auditor` | Admin, manager, department head | Assign auditor                           |
| `PATCH` | `/audits/items/:id/verify`  | Admin, manager, department head | Mark `VERIFIED`, `MISSING`, or `DAMAGED` |
| `POST`  | `/audits/:id/close`         | Admin, manager, department head | Close after all items verified           |

## Reports And Notifications

| Method  | Path                          | Roles                | Purpose                           |
| ------- | ----------------------------- | -------------------- | --------------------------------- |
| `GET`   | `/reports/dashboard`          | Any authenticated    | Dashboard metrics and trends      |
| `GET`   | `/reports`                    | Any authenticated    | Summary reports                   |
| `GET`   | `/reports/assets.csv`         | Admin, asset manager | Export asset register CSV         |
| `GET`   | `/reports/reports.csv`        | Admin, asset manager | Export summary CSV                |
| `GET`   | `/notifications`              | Any authenticated    | List current user's notifications |
| `GET`   | `/notifications/unread-count` | Any authenticated    | Unread count                      |
| `PATCH` | `/notifications/:id/read`     | Any authenticated    | Mark notification read            |
| `PATCH` | `/notifications/read-all`     | Any authenticated    | Mark all notifications read       |

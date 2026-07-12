# API Overview

Base URL: `http://localhost:5000`

Authentication uses `Authorization: Bearer <token>`.

## Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Organization

- `GET /departments`
- `POST /departments`
- `PUT /departments/:id`
- `DELETE /departments/:id`
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

## Assets

- `GET /assets`
- `GET /assets/:id`
- `POST /assets`
- `PUT /assets/:id`
- `DELETE /assets/:id`

## Workflows

- `GET /allocations`
- `POST /allocations`
- `POST /allocations/:id/return`
- `GET /transfers`
- `POST /transfers`
- `POST /transfers/:id/approve`
- `POST /transfers/:id/reject`
- `GET /bookings`
- `POST /bookings`
- `GET /maintenance`
- `POST /maintenance`
- `PATCH /maintenance/:id/status`
- `GET /audits`
- `POST /audits`
- `PATCH /audits/items/:id`
- `POST /audits/:id/close`

## Reports And Notifications

- `GET /reports/dashboard`
- `GET /reports/assets.csv`
- `GET /notifications`
- `PATCH /notifications/:id/read`

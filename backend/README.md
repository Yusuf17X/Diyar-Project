# Diyar Backend

Web app backend for compound management.

## What is Diyar?

Diyar is a multi-tenant SaaS backend for residential compound management in Iraq.
It serves four roles — admins, residents, security personnel, and maintenance staff —
each with their own portal and access level.

Admins manage properties, units, residents, billing, and announcements.
Residents pay invoices, submit maintenance requests, and generate visitor passes.
Security staff scan and validate visitor QR codes at the gate.
Maintenance staff are assigned and track repair tickets.

A single Diyar instance can run multiple compounds simultaneously,
with full data isolation between properties.

## What’s Included

- Express API under `/api/v1`
- Prisma with split schema files under `prisma/`
- JWT auth, role-based access, invoices, payments, visitor passes, tickets, dashboards, and security logs
- Seed data for demo properties and residents in `dev-data/seed.js`

## Quick Start

```bash
npm install
npm run seed
npm run dev
```

The API starts on port `3000` in the current server entrypoint.

## Demo Data

The seeded dataset creates five properties:

- Palm Heights
- Cedar Point
- Nile Vista
- Orchid Gardens
- Sphinx Residences

It also creates demo admin/resident accounts, units, invoices, payments, announcements, tickets, visitor passes, and security logs.

Useful sample values from the seed files:

- Demo admin login: `admin.palm@diyar.local` / `Password123!`
- Sample visitor pass guest names: `Samir Nasser`, `Lina Farid`
- Sample ticket titles: `Air conditioner not cooling`, `Hallway light flickering`, `Dishwasher leak`
- Sample invoice item data from `dev-data/bills-2026-05.json`: `RENT`, `WATER`, `ELECTRICITY`
- Payment demo payload from `dev-data/payment-demo.json`: `{ "invoiceId": "REPLACE_WITH_INVOICE_ID" }`

## Postman Docs

https://documenter.getpostman.com/view/45778430/2sBY4QtfbZ

Recommended workflow:

1. Import the environment first.
2. Import the collection.
3. Run the `Auth / Login` request to store a bearer token in `token`.
4. Fill in `propertyId`, `unitId`, `userId`, `invoiceId`, and other IDs from the seeded data or list endpoints.

## Key Endpoints

| Area               | Base Path                |
| ------------------ | ------------------------ |
| Auth and Users     | `/api/v1/users`          |
| Properties         | `/api/v1/properties`     |
| Units              | `/api/v1/units`          |
| Assignments        | `/api/v1/assignments`    |
| Announcements      | `/api/v1/announcements`  |
| Invoices           | `/api/v1/invoices`       |
| Payments           | `/api/v1/payments`       |
| Tickets            | `/api/v1/tickets`        |
| Visitor Passes     | `/api/v1/visitor-passes` |
| Resident Dashboard | `/api/v1/resident`       |
| Admin Dashboard    | `/api/v1/dashboard`      |
| Security Logs      | `/api/v1/security-logs`  |

Webhook endpoint:

- `POST /webhook-checkout`

## Notes

- Most protected requests require `Authorization: Bearer <token>`.
- `POST /webhook-checkout` expects Stripe’s raw body and signature, so it is usually tested with Stripe CLI or a real Stripe event.
- The collection includes seeded example payloads where the backend schema is clear; object IDs still need to be copied from your local database after seeding.

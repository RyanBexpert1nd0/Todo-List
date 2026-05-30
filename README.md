# CollabTodo — Real-time Collaborative Task Manager

A full-stack collaborative to-do list application for small teams, built with **Next.js 16** (frontend) and **Laravel 13** (backend).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui |
| Auth | Clerk (JWT-based, org-aware) |
| State | TanStack Query v5, Zustand |
| Backend | Laravel 13, PHP 8.3 |
| Database | SQLite (dev) / MySQL or PostgreSQL (prod) |
| Real-time | Laravel Reverb (WebSocket) |
| Forms | React Hook Form |
| DnD | @dnd-kit |

---

## Project Structure

```
.
├── backend/    # Laravel API
└── frontend/   # Next.js app
```

---

## Quick Start

### Prerequisites

- PHP 8.3+, Composer
- Node.js 20+, npm
- A [Clerk](https://clerk.com) account (free tier works)

---

### 1. Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Copy and configure environment
cp .env.example .env
php artisan key:generate

# Create SQLite database and run migrations
touch database/database.sqlite
php artisan migrate

# (Optional) Seed with demo data
php artisan db:seed

# Start the development server
php artisan serve
# → http://localhost:8000
```

**Required `.env` values to fill in:**

```env
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json
FRONTEND_URL=http://localhost:3000
```

For real-time features, also start Reverb:

```bash
php artisan reverb:start
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.local.example .env.local
# → Fill in your Clerk publishable key and other values

# Start the development server
npm run dev
# → http://localhost:3000
```

**Required `.env.local` values:**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

### 3. Clerk Webhook (for user/org sync)

In your Clerk Dashboard → **Webhooks**, create a new endpoint:

- **URL**: `https://your-domain.com/api/webhooks/clerk`
- **Events to subscribe**:
  - `user.created`, `user.updated`, `user.deleted`
  - `organization.created`, `organization.updated`, `organization.deleted`
  - `organizationMembership.created`, `organizationMembership.deleted`

This keeps your local `users`, `organizations`, and `memberships` tables in sync with Clerk.

---

## API Endpoints

All endpoints (except health check and webhook) require a Clerk JWT in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/webhooks/clerk` | Clerk webhook receiver |
| GET | `/api/organizations/{org}/dashboard` | Dashboard stats |
| GET | `/api/organizations/{org}/tasks` | List tasks (filterable) |
| POST | `/api/organizations/{org}/tasks` | Create task |
| GET | `/api/organizations/{org}/tasks/{id}` | Get task detail |
| PUT | `/api/organizations/{org}/tasks/{id}` | Update task |
| DELETE | `/api/organizations/{org}/tasks/{id}` | Delete task (soft) |
| PATCH | `/api/organizations/{org}/tasks/{id}/toggle` | Toggle done/todo |
| PATCH | `/api/organizations/{org}/tasks/reorder` | Reorder tasks |
| POST | `/api/organizations/{org}/tasks/{id}/comments` | Add comment |
| GET | `/api/organizations/{org}/categories` | List categories |
| POST | `/api/organizations/{org}/categories` | Create category |
| PUT | `/api/organizations/{org}/categories/{id}` | Update category |
| DELETE | `/api/organizations/{org}/categories/{id}` | Delete category |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### Task Filters

`GET /api/organizations/{org}/tasks` supports these query params:

| Param | Values | Description |
|-------|--------|-------------|
| `status` | `todo`, `in_progress`, `done` | Filter by status |
| `priority` | `low`, `medium`, `high`, `urgent` | Filter by priority |
| `category_id` | UUID | Filter by category |
| `assigned_to` | UUID | Filter by assignee |
| `filter` | `today`, `this_week`, `overdue` | Quick filters |
| `per_page` | integer | Pagination (default: 20) |

---

## Real-time Events

WebSocket events broadcast on private channel `org.{organization_id}`:

| Event | Trigger |
|-------|---------|
| `.TaskCreated` | New task created |
| `.TaskUpdated` | Task updated or toggled |
| `.TaskDeleted` | Task deleted |

---

## Database Schema

```
users               → clerk_id, email, name, avatar_url
organizations       → clerk_org_id, name, slug
memberships         → user_id, organization_id, role
categories          → organization_id, name, color
tasks               → organization_id, created_by, assigned_to, category_id, title, description, priority, status, deadline_at, sort_order, recurrence_type, completed_at (soft delete)
comments            → task_id, user_id, body
notifications       → user_id, task_id, type, body, read_at
```

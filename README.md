# CRM Frontend

Next.js 16 (App Router) + React 19 + Tailwind v4. The UI for the CRM: auth,
clients, dummy-user creation, and the deposit / withdrawal queues.

## Setup

Start `CRMBackend` first — every screen needs it.

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                    # http://localhost:3000
```

`node_modules`, `.next` and `.env.local` are not in this package.

`NEXT_PUBLIC_API_URL` must be the backend's exact origin. The auth cookie is
`httpOnly` and same-site, so a mismatched host silently logs you out on every
request — and the backend's `CORS_ORIGIN` has to name this app's origin exactly,
because the cookie is not sent under a wildcard.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run lint` | eslint |

## Layout

```
src/
  app/(shell)/          the authenticated shell: clients, create, deposits, withdrawals
  components/
    auth/               AuthProvider, LoginForm, RequireAuth
    clients/            list + profile card
    create/             dummy-user form, ported SCSS, admin-password modal
    working-dw/         the deposit / withdrawal queue and its stage menus
    layout/             shell chrome, the global Deposit/Withdrawal switch
  lib/                  API clients — one module per resource
```

### The ported SCSS

`src/components/create/*.scss` is diwine_admin_ui's stylesheet copied verbatim,
wrapped in a scope class instead of Angular's view encapsulation. It also
carries the `::ng-deep` blocks from that project's `admin.component.scss`,
which pierce into child components — buttons, spacing and the dark theme come
from there, so dropping them silently breaks the form's appearance.

Because those class names have to survive, it is a plain stylesheet and not a
CSS module. Don't "modernise" it into Tailwind unless you are replacing the
whole form; matching it by hand was tried and does not come out pixel-accurate.

## Deposit / withdrawal screens

Deposit and Withdrawal are two routes (`/deposits`, `/withdrawals`) sharing one
component. The switch lives in the shell header, so it is present on every page
and navigates rather than toggling local state; the active side is read from the
URL.

Each row's **Banker** and **Admin** cells are menus, and what they offer depends
on where the request is:

| Row | Banker menu | Admin menu |
|---|---|---|
| Deposit, PENDING | Verify · Claim/Release · Reject | locked until verified |
| Withdrawal, PENDING | Process withdrawal · Claim/Release · Reject | locked until verified |
| Withdrawal, PROCESSING | Verify · Reject | locked until verified |
| Any, verified | — | Approve · Reject |

The money moves at **Approve**, not at Verify. Both root and normal requests
need that second sign-off, which is why the Admin cell is live for both.

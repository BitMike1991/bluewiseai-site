# BlueWise AI Platform

Multi-tenant SaaS platform for trades businesses. Voice AI, SMS automation, lead management.

## Tech Stack

- **Framework**: Next.js 15.5 (Pages Router)
- **Frontend**: React 19 + Tailwind CSS 3.4
- **Auth**: Supabase SSR (@supabase/ssr)
- **Database**: Supabase PostgreSQL (multi-tenant, `customer_id` on all tables)
- **AI**: OpenAI API (chat completions)
- **Icons**: lucide-react
- **Email**: Mailgun
- **Deployment**: Vercel (auto-deploy from GitHub main)
- **Automation**: n8n (automation.bluewiseai.com)
- **Voice**: VAPI + Telnyx
- **Payments**: Stripe

## Project Structure

```
pages/
├── api/                 # Backend API routes
│   ├── ask.js           # AI assistant endpoint
│   ├── overview.js      # Dashboard KPIs
│   ├── leads/           # Lead CRUD
│   ├── jobs/            # Job CRUD
│   ├── tasks/           # Task CRUD
│   ├── calls/           # Call logs
│   ├── inbox/           # Message threads
│   └── settings/        # Customer settings
├── platform/            # Authenticated dashboard (requires login)
│   ├── overview.js      # Main dashboard
│   ├── ask.js           # Command Center (AI chat)
│   ├── leads/           # Lead list + detail
│   ├── jobs/            # Job list + detail
│   ├── tasks/           # Task management
│   ├── calls/           # Call history
│   └── login.js         # Auth page
├── fr/                  # French pages (Quebec French)
├── index.js             # Homepage EN
├── lead-rescue.js       # Product page
├── services.js          # Services page
└── contact.js           # Contact page

src/
├── components/dashboard/
│   ├── DashboardLayout.js  # Auth wrapper + sidebar + topnav
│   ├── Sidebar.js          # Navigation with lucide icons
│   ├── TopNav.js           # Breadcrumbs + user avatar
│   └── StatCard.js         # KPI card component (icon + accent props)
└── styles/
    └── globals.css         # Tailwind base + Inter font
```

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Multi-Tenant Architecture

- ALL data queries MUST filter by `customer_id`
- `customer_id` comes from `customer_users` table (maps auth user → customer)
- API routes: extract user from Supabase session → lookup customer_id → filter data
- `inbox_messages.lead_id` references `inbox_leads.id` (NOT `leads.id`)
- `inbox_leads.customer_id` is stored as STRING (not integer)

## Database Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `customers` | Tenant accounts | id, name, onboarding_intake |
| `customer_users` | User→Customer mapping | user_id, customer_id |
| `leads` | Contact records | customer_id, name, phone, email, score |
| `inbox_leads` | Conversation threads | customer_id (STRING), phone |
| `inbox_messages` | Messages in threads | lead_id→inbox_leads.id, channel |
| `inbox_lead_events` | Activity timeline | lead_id, event_type |
| `jobs` | Work orders | customer_id, lead_id, status, job_id |
| `contracts` | Legal documents | job_id, signed_at |
| `payments` | Payment records | job_id, stripe_payment_id |
| `tasks` | Follow-up tasks | customer_id, lead_id, type, priority |

## Code Standards

- Functional components only (no class components)
- Tailwind utility classes (no custom CSS except globals.css)
- Inter font via next/font/google (CSS variable approach)
- Color avatars: deterministic hash → 8-color palette
- French = Quebec French ("pis", "fait du sens", "t'as")
- API routes return JSON with proper error status codes
- Use `supabase.auth.getSession()` for auth checks in API routes

## Critical Rules

- NEVER query without `customer_id` filter (data leak risk)
- NEVER hardcode customer_id — always derive from auth session
- NEVER use `inbox_messages.lead_id` as if it references `leads.id`
- ALWAYS test multi-tenant isolation (customer 1 vs 7 vs 8)
- Pages Router (NOT App Router) — this project uses `pages/` directory
- Vercel auto-deploys on push to main — test before pushing

## Customer Systems

| System | customer_id | Domain | Phone |
|--------|-------------|--------|-------|
| BlueWise AI | 1 | bluewiseai.com | — |
| Ramoneur | 7 | +14386065711 | +14386065711 |
| Service Plus | 8 | serviceplus.plus | — |

## Do Not

- Do not add TypeScript (project is JavaScript)
- Do not switch to App Router
- Do not add unnecessary dependencies
- Do not create test files (no test framework configured)
- Do not modify auth flow without explicit request
- Do not refactor working code unless asked

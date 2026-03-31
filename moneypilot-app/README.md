# MoneyPilot

AI-powered family finance management with smart insights and forecasting.

## Features

- **Household Management** - Multiple family members, unified view with role-based access
- **Smart Dashboard** - Net worth tracking, cashflow charts, spending breakdowns
- **Goal Tracking** - Set and track savings goals with progress visualization
- **Receipt Scanning** - AI-powered OCR to extract transaction data from receipts
- **AI Insights** - Financial health scores, risk flags, and personalized suggestions
- **Transaction Management** - Manual entry, CSV import, categorization
- **Secure & Private** - Row-level security ensures data isolation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (Auth, Postgres, Storage)
- **AI**: Claude API (Anthropic) for OCR and financial insights
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key

### Installation

1. Clone the repository and install dependencies:

```bash
cd moneypilot-app
npm install
```

2. Copy the environment variables:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Set up the database:

   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase/schema.sql`

5. Set up storage:

   - In Supabase, go to Storage
   - Create a bucket named `receipts`
   - Set appropriate policies for authenticated users

6. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
moneypilot-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (dashboard)/       # Dashboard pages
│   │   ├── api/               # API routes
│   │   └── auth/callback/     # OAuth callback
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── charts/            # Chart components
│   │   └── dashboard/         # Dashboard components
│   ├── lib/
│   │   ├── supabase/          # Supabase clients
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── database.ts        # TypeScript types
├── supabase/
│   └── schema.sql             # Database schema
└── public/                    # Static assets
```

## Database Schema

- **households** - Root entity for family groups
- **profiles** - User profiles (extends Supabase auth)
- **household_members** - Links users to households with roles
- **accounts** - Bank accounts, credit cards, etc.
- **categories** - Transaction categories
- **transactions** - Financial transactions
- **receipts** - Uploaded receipt images with OCR data
- **goals** - Savings goals
- **ai_insights** - Cached AI analysis results

## API Routes

- `GET/POST /api/transactions` - Transaction CRUD
- `GET/POST /api/receipts` - Receipt upload and listing
- `POST /api/receipts/[id]/parse` - OCR processing with Claude
- `GET/POST /api/ai/insights` - AI financial analysis

## Build Phases

1. **Foundation & Ledger** - Core data model, auth, basic CRUD
2. **Dashboard & Charts** - Visualizations, reports
3. **Camera Receipt Input** - OCR integration
4. **Forecast, Judgement & Suggestions** - AI engine

## License

MIT

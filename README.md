# Artha Network Web App

> **Sprint 3 Capstone Project**  
> Frontend application for the Artha Network - A decentralized AI-powered escrow platform on Solana

[![Sprint 3](https://img.shields.io/badge/Sprint-3-green.svg)](https://github.com/Artha-Network/web-app)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Sprint 3 Accomplishments](#sprint-3-accomplishments)
- [Documentation](#documentation)

## Overview

User-facing React application for creating and managing peer-to-peer escrow deals on the Solana blockchain with AI-powered dispute resolution via the Gemini API.

### Key Features

- 🔐 **Wallet Integration** - Phantom, Solflare, and Backpack wallet support
- 💼 **Deal Management** - Create, fund, release, and refund USDC escrow deals
- ⚖️ **Dispute Resolution** - Open disputes, submit evidence, AI arbitration
- 📊 **Dashboard Analytics** - Real-time deal statistics and activity feed
- 🔗 **Solana Actions (Blinks)** - Shareable deal links with embedded transactions
- 🎨 **Modern UI** - Atomic Design with shadcn/ui components and Tailwind CSS

## Prerequisites

Before running this application locally, ensure you have the following installed:

| Requirement | Version | Installation |
|------------|---------|--------------|
| **Node.js** | 18.x or 20.x | [Download](https://nodejs.org/) |
| **npm** | 9.x+ | Included with Node.js |
| **Git** | Latest | [Download](https://git-scm.com/) |
| **Solana Wallet** | - | [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/) |

### Optional Tools

- **pnpm** (alternative package manager): `npm install -g pnpm`
- **Bun** (faster package manager): [Install Bun](https://bun.sh/)

## Installation

### 1. Clone the Repository

```bash
cd /path/to/your/workspace
git clone https://github.com/Artha-Network/Artha-Network.git
cd Artha-Network/web-app
```

### 2. Install Dependencies

Choose your preferred package manager:

```bash
# Using npm (recommended)
npm install

# Using pnpm
pnpm install

# Using bun
bun install
```

This will install all dependencies including:
- React 18 and React DOM
- Solana Web3.js and Wallet Adapter
- Radix UI components
- TanStack Query (React Query)
- Tailwind CSS
- And more (see `package.json`)

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the `web-app/` directory:

```bash
touch .env
```

### 2. Configure Environment Variables

Copy and paste the following into your `.env` file:

```bash
# Solana Configuration
VITE_SOLANA_CLUSTER=devnet
VITE_SOLANA_RPC=https://api.devnet.solana.com

# Actions Server (Backend API)
VITE_ACTIONS_SERVER_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# On-chain Program
VITE_PROGRAM_ID=HM1zYGd6WVH8e73U9QZW8spamWmLqzd391raEsfiNzEZ
```

### 3. Variable Descriptions

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SOLANA_CLUSTER` | Solana network (`devnet`, `testnet`, `mainnet-beta`) | `devnet` |
| `VITE_SOLANA_RPC` | RPC endpoint URL for Solana | `https://api.devnet.solana.com` |
| `VITE_ACTIONS_SERVER_URL` | Backend API server URL | `http://localhost:4000` |
| `VITE_SUPABASE_URL` | Supabase project URL | Required from Supabase dashboard |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Required from Supabase dashboard |
| `VITE_PROGRAM_ID` | Deployed escrow program ID | Devnet program ID |

### 4. Getting Supabase Credentials

If you don't have Supabase credentials:

1. Go to [Supabase](https://supabase.com/) and create a free account
2. Create a new project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**
5. Paste them into your `.env` file

**Note**: You can use the shared Supabase instance if part of the Artha Network team.

## Running the Application

### 1. Start the Backend (Actions Server)

The web app requires the **actions-server** to be running. In a separate terminal:

```bash
# Navigate to actions-server
cd ../actions-server

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

The actions-server should start on `http://localhost:4000`.

**See [actions-server README](../actions-server/README.md) for detailed setup.**

### 2. Start the Web App

Return to the `web-app/` directory and start the development server:

```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev

# Using bun
bun dev
```

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:8080
```

You should see the Artha Network landing page.

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 18 | UI library with hooks and concurrent features |
| **Language** | TypeScript 5 | Type-safe JavaScript |
| **Build Tool** | Vite 5 | Fast development server and build tool |
| **Styling** | Tailwind CSS 3 | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Pre-built Radix UI + Tailwind components |
| **State Management** | TanStack Query v5 | Server state and caching |
| **Routing** | React Router v6 | Client-side routing |
| **Wallet Adapter** | @solana/wallet-adapter | Solana wallet integration |
| **Blockchain** | @solana/web3.js | Solana blockchain interaction |
| **Backend Client** | Fetch API | HTTP requests to actions-server |
| **Database** | Supabase | PostgreSQL with real-time subscriptions |

## Project Status - Sprint 3

### Completed Features

**Sprint 1-2: Core Infrastructure**
- Wallet connection and authentication
- Landing page with hero, features, how it works
- Basic deal list and detail views
- Atomic Design component architecture

**Sprint 3: Enhanced Functionality**
- Dashboard with deal statistics
- Deal creation flow with validation
- Funding and release transactions
- Dispute opening and evidence submission
- Status tracking and timeline views
- Integration with actions-server API
- SDK utilities integration (solana-kit)

### System Integration

```
┌─────────────┐
│   Web App   │ (This repository)
└──────┬──────┘
       │
       ├──▶ actions-server     (API & Actions)
       ├──▶ solana-kit          (SDK utilities)
       ├──▶ onchain-escrow      (Smart contracts)
       └──▶ arbiter-service     (AI dispute resolution)
```

## Architecture

### Atomic Design Structure

```
src/
├── components/
│   ├── atoms/           # Basic UI primitives (buttons, inputs)
│   ├── molecules/       # Simple component combinations
│   ├── organisms/       # Complex UI sections
│   └── templates/       # Page layouts
├── pages/               # Route components
│   ├── Index.tsx              # Landing page
│   ├── Dashboard.tsx          # User dashboard
│   ├── Deals.tsx              # Deal list
│   ├── DealDetail.tsx         # Single deal view
│   ├── CreateDeal.tsx         # Deal creation
│   ├── EvidencePage.tsx       # Evidence submission
│   └── ResolutionPage.tsx     # Dispute resolution
├── hooks/               # Custom React hooks
│   ├── useWallet.ts           # Wallet management
│   ├── useDeals.ts            # Deal operations
│   └── useEvent.ts            # Analytics tracking
├── features/            # Feature modules
│   ├── escrow/                # Escrow logic
│   └── wallet/                # Wallet logic
├── services/            # API clients
├── lib/                 # Utilities
└── types/               # TypeScript types
```

### Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Marketing and onboarding |
| Dashboard | `/dashboard` | User overview and stats |
| Deals List | `/deals` | All user deals |
| Deal Detail | `/deal/:id` | Single deal management |
| Create Deal | `/create` | New deal creation |
| Evidence | `/deal/:id/evidence` | Submit dispute evidence |
| Resolution | `/deal/:id/resolution` | View AI decision |

## Setup & Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env.local`:

```bash
VITE_SOLANA_NETWORK=devnet
VITE_RPC_URL=https://api.devnet.solana.com
VITE_ACTIONS_SERVER_URL=http://localhost:8787
VITE_PROGRAM_ID=HM1zYGd6WVH8e73U9QZW8spamWmLqzd391raEsfiNzEZ
```

## Development

### Project Structure

```
web-app/
├── src/
│   ├── components/          # UI components (Atomic Design)
│   │   ├── atoms/          # Basic elements (Button, Input, Badge)
│   │   ├── molecules/      # Simple combinations (DealCard, FormField)
│   │   ├── organisms/      # Complex sections (Header, DealGrid, Footer)
│   │   └── ui/            # shadcn/ui primitives
│   ├── pages/              # Route components
│   │   ├── Index.tsx            # Landing page
│   │   ├── Dashboard.tsx        # User dashboard
│   │   ├── Deals.tsx            # Deal list view
│   │   ├── DealOverview.tsx     # Single deal detail
│   │   └── escrow/              # Multi-step deal creation
│   ├── hooks/              # Custom React hooks
│   │   ├── useWalletConnection.ts   # Wallet management
│   │   ├── useDeals.ts              # Deal operations
│   │   ├── useAction.ts             # Action execution
│   │   └── useEvent.ts              # Analytics tracking
│   ├── providers/          # Context providers
│   │   ├── SolanaWalletProvider.tsx # Wallet context
│   │   └── QueryProvider.tsx        # React Query setup
│   ├── services/           # API clients
│   │   └── actions.ts              # Actions server API
│   ├── lib/                # Utilities and helpers
│   │   ├── supabaseClient.ts       # Supabase client
│   │   └── utils.ts                # General utilities
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Root component
├── public/                 # Static assets (images, fonts)
├── docs/                   # Documentation
├── .env                    # Environment variables (not committed)
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:8080)
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

### Adding New Features

#### 1. Creating a New Page

```bash
# Create new page component
touch src/pages/MyNewPage.tsx
```

```tsx
// src/pages/MyNewPage.tsx
import { useWallet } from '@solana/wallet-adapter-react';

export default function MyNewPage() {
  const { publicKey } = useWallet();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">My New Page</h1>
      {publicKey ? (
        <p>Connected: {publicKey.toBase58()}</p>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}
```

Add route in `src/App.tsx`:

```tsx
import MyNewPage from './pages/MyNewPage';

// Inside Routes component
<Route path="/my-new-page" element={<MyNewPage />} />
```

#### 2. Creating a New Component

Follow Atomic Design principles:

```bash
# Atom example (basic button)
touch src/components/atoms/CustomButton.tsx

# Molecule example (form field with label)
touch src/components/molecules/LabeledInput.tsx

# Organism example (complete form)
touch src/components/organisms/DealForm.tsx
```

#### 3. Adding a New API Endpoint

```typescript
// src/services/actions.ts
export async function fetchDealById(dealId: string) {
  const response = await fetch(
    `${ACTIONS_BASE_URL}/api/deals/${dealId}`
  );
  return response.json();
}
```

Use with React Query:

```typescript
// src/hooks/useDeals.ts
export function useDeal(dealId: string) {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => fetchDealById(dealId),
  });
}
```

### Code Style Guidelines

- **Components**: PascalCase (`DealCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useDeals.ts`)
- **Utilities**: camelCase (`formatAmount.ts`)
- **Types**: PascalCase with descriptive names (`DealStatus`, `EscrowState`)
- **CSS Classes**: Tailwind utility classes (no custom CSS unless necessary)

### User Flows

#### 1. Create Deal Flow
```
Connect Wallet → Dashboard → Create Deal → 
Enter Details (counterparty, amount, deadlines) → 
Review → Sign Transaction → Deal Created
```

#### 2. Fund Deal Flow
```
View Deal → Verify Details → Click "Fund" → 
Approve USDC Transfer → Sign Transaction → Deal Funded
```

#### 3. Dispute Flow
```
Open Dispute → Upload Evidence (files/text) → 
Submit to AI Arbiter → Wait for Resolution → 
View Decision → Execute (Release/Refund)
```

## Component Development

### Atomic Design Guidelines

**Atoms** (`components/atoms/ui/`)
- Single-purpose UI primitives
- No business logic
- Highly reusable
- Based on shadcn/ui

**Molecules** (`components/molecules/`)
- 2-3 atoms combined
- Simple interactions
- Feature-agnostic

**Organisms** (`components/organisms/`)
- Complex UI sections
- May contain business logic
- Feature-specific

**Pages** (`pages/`)
- Route components
- Data fetching
- State management

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed component patterns.

## API Integration

### Actions Server Endpoints

```typescript
// Create deal
POST /api/escrow/initiate

// Fund deal
POST /api/escrow/fund

// Open dispute
POST /api/escrow/dispute

// Submit evidence
POST /api/escrow/evidence

// Get deals
GET /api/deals?wallet={address}
```

### SDK Usage (solana-kit)

```typescript
import { 
  deriveEscrowStatePDA,
  parseTokenAmount,
  validateAmount,
  PROGRAM_IDS
} from "@artha-network/solana-kit";

// Derive deal address
const [escrowState] = deriveEscrowStatePDA(
  seller, buyer, mint, PROGRAM_IDS.devnet
);

// Parse user input
const amount = parseTokenAmount("100"); // 100 USDC

// Validate before transaction
const validation = validateAmount(amount);
```

## Testing

### Type Checking

```bash
# Check TypeScript types
npx tsc --noEmit
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npx eslint . --fix
```

### Manual Testing Checklist

- [ ] Wallet connection (Phantom, Solflare)
- [ ] Create deal with valid inputs
- [ ] Fund deal with sufficient USDC balance
- [ ] Release funds after delivery
- [ ] Open dispute and submit evidence
- [ ] View deal history and timeline
- [ ] Dashboard statistics update correctly
- [ ] Responsive design on mobile/tablet
- [ ] Error handling and toast notifications

### Testing with Devnet

1. **Get Devnet SOL**: Use [Solana Faucet](https://faucet.solana.com/)
2. **Get Devnet USDC**: Contact team or use test mint
3. **Create Test Deals**: Use small amounts (1-10 USDC)
4. **Test Disputes**: Open disputes and submit mock evidence

## Deployment

### Build for Production

```bash
# Create optimized production build
npm run build
```

This generates a `dist/` directory with optimized static files.

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add all variables from `.env`
   - For production, update:
     - `VITE_SOLANA_CLUSTER=mainnet-beta`
     - `VITE_SOLANA_RPC=https://api.mainnet-beta.solana.com`
     - `VITE_PROGRAM_ID=<mainnet-program-id>`

### Deploy to Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Add all `VITE_*` variables

### Deploy to AWS Amplify

1. Connect your GitHub repository
2. Build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables in Amplify console

### Preview Build Locally

```bash
# Build and preview
npm run build
npm run preview
```

Access at `http://localhost:4173`

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@/components/...'"

**Solution**: Ensure path aliases are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 2. Wallet not connecting

**Causes**:
- Wallet extension not installed
- Wrong network selected in wallet
- Browser blocking popups

**Solutions**:
- Install [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/)
- Switch wallet to devnet
- Allow popups for `localhost:8080`

#### 3. "Actions server not reachable"

**Solution**: 
- Ensure actions-server is running on `http://localhost:4000`
- Check `VITE_ACTIONS_SERVER_URL` in `.env`
- Verify CORS settings in actions-server

#### 4. Supabase connection errors

**Solutions**:
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Ensure RLS policies allow public access where needed

#### 5. Build fails with "out of memory"

**Solution**: Increase Node.js memory:

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

#### 6. Transactions failing silently

**Debug steps**:
1. Open browser DevTools → Console
2. Check for error messages
3. Verify wallet has SOL for transaction fees (~0.001 SOL)
4. Ensure USDC token account exists
5. Check Solana Explorer for transaction details

### Getting Help

- **Project Documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Solana Docs**: [docs.solana.com](https://docs.solana.com)
- **Wallet Adapter**: [github.com/solana-labs/wallet-adapter](https://github.com/solana-labs/wallet-adapter)
- **Team Support**: Open an issue on GitHub

## Sprint 3 Accomplishments

**Frontend Enhancements:**
- Complete deal lifecycle UI
- Evidence upload with file handling
- Real-time transaction status
- Wallet balance display
- Error handling and user feedback

**Integration:**
- Connected to actions-server API
- Integrated solana-kit utilities
- Implemented Solana wallet adapter
- Added analytics event tracking

**UX Improvements:**
- Loading states and skeletons
- Toast notifications
- Form validation with clear errors
- Responsive design for mobile

## Roadmap

**Capstone 2 Goals:**
- Reputation score display
- Deal templates
- Batch operations
- Mobile app (React Native)

**Future Enhancements:**
- Multi-token support
- Advanced filtering and search
- Chat integration
- Notification system

## Contributing

See [docs/contribution-guide.md](./docs/contribution-guide.md)

## Documentation

### Internal Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed Atomic Design component patterns
- **[FRONTEND_ANALYSIS.md](./FRONTEND_ANALYSIS.md)** - Technical analysis and feature reference
- **[docs/](./docs/)** - Component-specific documentation

### External Documentation

- **[Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)** - Blockchain interaction
- **[Wallet Adapter](https://github.com/solana-labs/wallet-adapter)** - Wallet integration
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component library
- **[TanStack Query](https://tanstack.com/query/latest)** - Data fetching and caching
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling framework

## Related Repositories

This web app is part of the larger **Artha Network** ecosystem:

| Repository | Purpose | Tech Stack |
|-----------|---------|-----------|
| **[onchain-escrow](../onchain-escrow)** | Solana smart contracts | Rust, Anchor 0.32 |
| **[actions-server](../actions-server)** | Backend API & Blinks | Node.js, Express, Prisma |
| **[solana-kit](../solana-kit)** | TypeScript SDK | TypeScript, Anchor client |
| **[arbiter-service](../arbiter-service)** | AI dispute resolution | Node.js, Gemini API |
| **[jobs-service](../jobs-service)** | Background workers | Node.js, BullMQ, Redis |
| **[core-domain](../core-domain)** | Shared business logic | TypeScript |
| **[tickets-lib](../tickets-lib)** | Resolution ticket system | TypeScript |

### Repository Workflow

```
                    ┌─────────────────┐
                    │   Web App       │ (This repo)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Actions Server  │ ◄── Builds transactions
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼────────┐
    │ Onchain      │  │ Arbiter     │  │ Jobs        │
    │ Escrow       │  │ Service     │  │ Service     │
    │ (Program)    │  │ (AI)        │  │ (Workers)   │
    └──────────────┘  └─────────────┘  └─────────────┘
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following code style guidelines
4. **Test thoroughly** on devnet
5. **Commit with descriptive messages**: `git commit -m "feat: add dispute evidence upload"`
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request** with detailed description

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Review Process

All PRs require:
- [ ] Code review from at least one team member
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] ESLint warnings addressed

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Artha-Network/Artha-Network/issues)
- **Team Email**: support@arthanetwork.dev
- **Discord**: [Join our community](https://discord.gg/artha-network)

## Acknowledgments

- **Solana Foundation** - Blockchain infrastructure
- **Anchor Lang** - Smart contract framework
- **shadcn/ui** - Beautiful component library
- **Vercel** - Deployment platform

---

**Built with ❤️ by the Artha Network Team**  
*Capstone Project - Sprint 3 | December 2025*

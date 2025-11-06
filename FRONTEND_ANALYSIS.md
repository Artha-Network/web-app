# Artha Network Frontend Analysis & Reference

**Date**: November 5, 2025  
**Purpose**: Comprehensive frontend structure analysis for development reference

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Solana Integration**: @solana/wallet-adapter (Phantom/Solflare)
- **Backend**: Supabase (PostgreSQL + RLS) + Actions Server
- **Build Tool**: Vite with SWC
- **Package Manager**: Supports npm/pnpm/bun

## 📁 Directory Structure

```
web-app/
├── src/
│   ├── components/           # Atomic Design structure
│   │   ├── atoms/           # Basic UI (Button, Input, Badge)
│   │   ├── molecules/       # Combinations (DealCard, NotificationItem)
│   │   ├── organisms/       # Complex sections (HeaderBar, ActiveDealsGrid)
│   │   └── ui/             # shadcn/ui primitives
│   ├── pages/              # Route components
│   │   ├── Index.tsx       # Landing page
│   │   ├── Dashboard.tsx   # Main user dashboard
│   │   ├── escrow/         # Multi-step escrow flow
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── providers/          # Context providers
│   ├── services/           # API services
│   ├── lib/               # Utilities and clients
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Component documentation
└── ...
```

## 🚀 Key Features & Pages

### 1. Landing Page (`Index.tsx`)
**Components**: Hero + Features + HowItWorks + Team + Footer
- Animated gradient hero with floating elements
- Feature grid showcasing 6 key capabilities
- Step-by-step process explanation
- Team member showcase
- Modern design with glass morphism effects

### 2. Dashboard (`Dashboard.tsx`)
**Layout**: Three-column responsive layout
- **Left**: Main content with active deals grid
- **Right**: Sidebar with reputation score + notifications + activity feed
- **Data Sources**: Real-time from Supabase via useMyDeals hook
- **Protected**: Requires wallet connection

### 3. Escrow Flow (Multi-step)
**Steps**: 3-step wizard with progress indicator
- **Step 1**: Deal setup (counterparty, amount, description, deadlines)
- **Step 2**: Review and confirmation
- **Step 3**: Final submission and blockchain transaction
- **State**: Managed by useEscrowFlow hook

### 4. Deal Management
- **Deal Overview**: Individual deal details with action buttons
- **Active Deals Grid**: Card-based layout with status badges
- **Real-time Updates**: Status changes via TanStack Query

## 🔗 Solana Integration

### Wallet Connection Flow
```tsx
<SolanaWalletProvider>
  <WalletProvider wallets={[Phantom, Solflare]}>
    <ModalProvider>
      <App />
    </ModalProvider>
  </WalletProvider>
</SolanaWalletProvider>
```

### Transaction Handling
```typescript
// Complete transaction flow
const action = useAction("initiate");
await action.mutateAsync({
  counterparty: buyerWallet,
  amount: 125,
  description: "Demo escrow"
});

// Flow: Frontend → Actions Server → Unsigned Tx → Wallet Sign → Confirmation
```

### Wallet Adapter Integration
- **Providers**: Phantom, Solflare supported
- **Auto-connect**: Enabled for better UX
- **Modal**: Custom wallet selection modal
- **State**: useWallet hook from @solana/wallet-adapter-react

## 🌐 Backend Integration

### Actions Server Communication
**Base URL**: Configured via environment variables
**Endpoints**:
- `POST /actions/initiate` - Create new escrow
- `POST /actions/fund` - Fund existing escrow
- `POST /actions/release` - Release funds to seller
- `POST /actions/refund` - Refund to buyer
- `POST /actions/confirm` - Confirm transaction

**Response Format**:
```typescript
interface ActionResponse {
  dealId: string;
  txMessageBase64: string;  // For wallet signing
  nextClientAction?: string;
  latestBlockhash: string;
  lastValidBlockHeight: number;
  feePayer: string;
}
```

### Supabase Integration
**Tables**: deals, onchain_events, user data
**Authentication**: Wallet-based (no traditional login)
**Security**: Row-level security (RLS) policies
**Real-time**: Live updates via subscriptions
**Keys**: 
- Client: anon key (safe for frontend)
- Server: service role key (backend only)

## 🎨 Design System

### Component Architecture (Atomic Design)
```
Atoms (Level 1)     → Button, Input, Badge, Avatar
Molecules (Level 2) → DealCard, FormField, NotificationItem  
Organisms (Level 3) → HeaderBar, ActiveDealsGrid, Hero
Templates (Level 4) → EscrowFlowTemplate, BaseLayout
Pages (Level 5)     → Dashboard, Index, DealOverview
```

### Color System
**Semantic Tokens**: Defined in `src/index.css`
- `--primary`: Main brand color
- `--secondary`: Secondary brand color  
- `--accent`: Accent highlights
- `--background`: Page background
- `--foreground`: Text color
- `--muted`: Subtle text/backgrounds

### Responsive Design
**Breakpoints**: Tailwind default
- `sm`: 640px+
- `md`: 768px+  
- `lg`: 1024px+
- `xl`: 1280px+

**Pattern**: Mobile-first design with progressive enhancement

## 📊 State Management

### TanStack Query Setup
```typescript
const queryClient = new QueryClient();

// Key patterns:
["my-deals"] - User's deals
["deal", dealId] - Individual deal
["recent-events"] - Activity timeline
```

### Custom Hooks
- **`useAction<T>`**: Generic hook for blockchain transactions
- **`useMyDeals()`**: Fetch user's deals from Supabase
- **`useWallet()`**: Re-export of Solana wallet adapter
- **`useEscrowFlow()`**: Multi-step form state management
- **`useWalletTransactions()`**: Transaction signing utilities

## 🔒 Security & Authentication

### Wallet-based Authentication
- **No Traditional Auth**: Wallet connection = authentication
- **Protected Routes**: ProtectedRoute component guards private pages
- **Session**: Wallet connection state persisted in localStorage

### Data Security
- **Frontend**: Only anon Supabase key exposed
- **Backend**: Service role for privileged operations
- **Transactions**: All require explicit wallet signature

## 🔄 Data Flow

### Complete Transaction Flow
```
User Action → useAction Hook → Actions Server → Build Unsigned Tx → 
Wallet Sign → Broadcast → Confirmation → Supabase Update → UI Refresh
```

### State Synchronization
```
Blockchain Events → Actions Server → Supabase → TanStack Query → UI Update
```

## 📱 User Experience

### Navigation Flow
1. **Landing Page**: Hero with wallet connect CTA
2. **Wallet Connection**: Modal-based selection (Phantom/Solflare)  
3. **Dashboard Redirect**: Automatic after successful connection
4. **Protected Navigation**: All main features require wallet

### Status Management
**Deal Statuses**: Init → Funded → Disputed → Resolved → Released/Refunded
**Visual Indicators**: Color-coded badges and progress bars
**Real-time Updates**: Automatic refresh via TanStack Query

### Error Handling
- **Toast Notifications**: Sonner for user feedback
- **Transaction States**: Loading → Success/Error with specific messages
- **Graceful Degradation**: Fallback UI when data unavailable

## 🛠️ Development Patterns

### Component Creation
1. **TypeScript Interfaces**: Always define prop types
2. **Atomic Design**: Place in appropriate level
3. **Documentation**: Create .md and .json files
4. **Styling**: Use Tailwind utilities + CSS variables

### API Integration
1. **Services Layer**: Abstract API calls in `services/`
2. **Hook Wrapping**: Wrap service calls with TanStack Query
3. **Error Handling**: Consistent error boundaries
4. **Type Safety**: Full TypeScript coverage

### File Organization
```typescript
// Import order convention:
import React from 'react';           // React imports
import { Button } from '@/ui';       // UI components  
import { useWallet } from '@/hooks'; // Custom hooks
import { toast } from '@/lib';       // Utilities
import type { Deal } from '@/types'; // Types
```

## ⚙️ Environment Configuration

### Required Variables
```bash
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ID=program-id
NEXT_PUBLIC_USDC_MINT=usdc-mint-address
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=anon-key
VITE_SOLANA_RPC=https://api.devnet.solana.com
```

### Development Scripts
```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

## 🚀 Integration Points

### Current Integrations
1. **Onchain Program**: Via actions-server for transaction building
2. **Supabase**: For data persistence and real-time updates  
3. **Solana Wallets**: For signing and authentication

### Ready for Integration
1. **AI Arbiter Service**: Dispute resolution endpoints
2. **Actions & Blinks**: Solana Actions protocol support
3. **Additional Wallets**: Easy to add more wallet adapters

## 📈 Performance Considerations

### Optimization Features
- **Code Splitting**: React.lazy for route-based splitting
- **Bundle Optimization**: Vite's native optimizations
- **Image Optimization**: Proper asset handling
- **Query Caching**: TanStack Query background updates

### Best Practices Implemented
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation

## 🔮 Architecture Benefits

### Scalability
- **Modular Components**: Easy to extend and modify
- **Service Layer**: Clean separation of concerns
- **Type Safety**: Reduces runtime errors
- **State Management**: Predictable data flow

### Maintainability  
- **Documentation**: Comprehensive component docs
- **Conventions**: Consistent file organization
- **Testing Ready**: Structure supports easy test addition
- **Version Control**: Clean Git history with atomic commits

---

**Status**: Production-ready frontend with professional architecture, security, and UX considerations. Ready for continued development and feature additions.

**Key Strengths**: Modern React patterns, comprehensive Solana integration, robust state management, professional design system, and scalable architecture.

**Next Steps**: This analysis provides the foundation for any frontend development work on the Artha Network platform.
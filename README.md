# Artha Network Web App

The frontend application for the Artha Network, providing a user interface for creating and managing escrow deals.

## Overview
This web app allows users to:
- Connect their Solana wallet.
- Create new escrow agreements (Blinks).
- View and manage existing deals.
- Raise disputes and submit evidence.

## Tech Stack
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **State Management**: React Query & Context API
- **Wallet**: Solana Wallet Adapter

## Setup
1. Run `npm install` to install dependencies.
2. Run `npm run dev` to start the development server.

## Key Directories
- `src/components`: Reusable UI components (Atoms, Molecules, Organisms).
- `src/pages`: Application pages and route handlers.
- `src/features`: Feature-specific logic (e.g., Escrow, Wallet).
- `src/hooks`: Custom React hooks.

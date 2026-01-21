# KR8TIV Launchpad

A complete token launchpad on Solana with creator configurable tokenomics, staking rewards, and automated fee distribution.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solana](https://img.shields.io/badge/Solana-Mainnet-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue.svg)
![Anchor](https://img.shields.io/badge/Anchor-0.29.0-purple.svg)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Token Launch Flow](#token-launch-flow)
- [Staking Mechanics](#staking-mechanics)
- [Automation](#automation)
- [API](#api)
- [Environment](#environment)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

KR8TIV Launchpad enables creators to launch tokens on Solana via Bags.fm with fully customizable, opt in tax mechanics. Stake KR8TIV to unlock platform fee discounts and earn staking rewards. Automation jobs claim fees and execute burns, LP adds, and dividends based on each token's configuration.

This repo includes:
- A Next.js 14 web app for creators and token explorers
- An Express API backend with Prisma and PostgreSQL
- An Anchor staking program for KR8TIV
- A shared TypeScript package for cross app types and utilities

## Architecture

```
kr8tiv-launchpad/
|-- apps/
|   |-- web/          # Next.js 14 frontend
|   `-- api/          # Express backend
|-- programs/
|   `-- staking/      # Anchor staking program (Rust)
|-- packages/
|   `-- shared/       # Shared types and utilities
`-- tests/            # Anchor program tests
```

## Features

### Token Launch
- Create tokens through Bags.fm API
- Opt in tax features (burn, LP, dividends, custom wallets)
- Creator dashboard with launch history and stats

### Staking
- Tiered fee discounts based on KR8TIV stake
- Lock duration multipliers for weighted stake
- Reward claiming with tier multipliers

### Automation
- Scheduled fee claiming and distribution
- Buy and burn support
- LP addition for graduated tokens
- Dividend distribution to holders

### Dashboard and Analytics
- Creator stats, token list, and trends
- Token pool analytics from Bags
- Live pricing via Jupiter price API

## Token Launch Flow

1. Creator submits token metadata and tax config
2. API stores a pending token record in Postgres
3. API creates token via Bags.fm
4. Token record updates to ACTIVE with Bags pool info
5. Automation runs hourly to claim and distribute fees

## Staking Mechanics

### Tier thresholds

| Tier | Staked Amount | Platform Fee | Reward Multiplier |
|------|---------------|--------------|-------------------|
| NONE | 0 | 5 percent | 1.0x |
| HOLDER | 1,000+ | 4 percent | 1.1x |
| PREMIUM | 10,000+ | 2 percent | 1.25x |
| VIP | 100,000+ | 0 percent | 1.5x |

### Lock duration bonuses

| Duration | Multiplier |
|----------|------------|
| 7 Days | 1.0x |
| 30 Days | 1.25x |
| 90 Days | 1.5x |
| 180 Days | 1.75x |
| 1 Year | 2.0x |

### Rewards formula (on chain)

- accumulated_reward_per_share += (time_elapsed * reward_rate * PRECISION) / total_weighted_stake
- pending = (weighted_stake * accumulated_reward_per_share / PRECISION) - reward_debt
- reward_with_bonus = pending * tier_multiplier_bps / 10000

### Program events

- StakeEvent
- UnstakeEvent
- ClaimEvent

## Automation

Automation runs on a schedule (node-cron) and supports manual admin triggers:

- Claim fees from Bags bonding curves
- Execute buy and burn
- Add liquidity to Raydium pools (for graduated tokens)
- Distribute dividends to holders

Scheduler is disabled by default in development. Set ENABLE_SCHEDULER=true to enable.

## API

Base URL: http://localhost:3001/api

### Launch

- POST /launch
- GET /tokens
- GET /tokens/recent
- GET /tokens/graduated
- GET /tokens/top

### Token details

- GET /tokens/:mint
- GET /tokens/:mint/stats
- GET /tokens/:mint/automation
- GET /tokens/:mint/holders
- GET /tokens/:mint/chart

### Staking

- POST /staking/stake
- POST /staking/unstake
- POST /staking/claim
- GET /staking/status/:wallet
- GET /staking/pool
- GET /staking/tiers
- GET /staking/leaderboard

### Stats

- GET /stats/platform
- GET /stats/creator/:wallet
- GET /stats/trending
- GET /stats/new
- GET /stats/automation

### Admin (requires X-API-Key)

- POST /admin/automation/trigger
- POST /admin/automation/run-all
- POST /admin/graduations/check
- GET /admin/jobs/pending
- GET /admin/jobs/failed
- POST /admin/jobs/:id/retry
- GET /admin/health
- POST /admin/tokens/:id/update-stats

### Example request

```json
{
  "name": "My Token",
  "symbol": "MTK",
  "description": "A cool token",
  "imageUrl": "https://...",
  "creatorWallet": "ABC123...",
  "burnEnabled": true,
  "burnPercentage": 200,
  "lpEnabled": true,
  "lpPercentage": 300,
  "dividendsEnabled": false,
  "dividendsPercentage": 0
}
```

## Environment

Create environment files for each app:

### API

Copy `apps/api/.env.example` to `apps/api/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kr8tiv_launchpad"
SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
BAGS_API_KEY="your_bags_api_key"
PLATFORM_TREASURY="PublicKey"
PLATFORM_PRIVATE_KEY="PrivateKey"
BURN_AGENT_PRIVATE_KEY="PrivateKey"
LP_AGENT_PRIVATE_KEY="PrivateKey"
KR8TIV_TOKEN_MINT="MintAddress"
STAKING_PROGRAM_ID="ProgramID"
PORT=3001
NODE_ENV=development
ADMIN_API_KEY="secure_random_key_here"
ENABLE_SCHEDULER=false
```

### Web

Copy `apps/web/.env.example` to `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_STAKING_PROGRAM_ID=
NEXT_PUBLIC_TOKEN_FACTORY_PROGRAM_ID=
NEXT_PUBLIC_KR8TIV_TOKEN_MINT=
```

## Development

### Prerequisites

- Node.js 20+
- Rust and Anchor CLI
- Solana CLI
- PostgreSQL

### Install

```bash
git clone https://github.com/Matt-Aurora-Ventures/kr8tiv-launchpad.git
cd kr8tiv-launchpad
npm install
```

### Run backend

```bash
cd apps/api
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Run frontend

```bash
cd apps/web
npm install
npm run dev
```

### Monorepo commands

```bash
npm run dev
npm run build
npm run api:dev
npm run web:dev
npm run anchor:build
npm run anchor:test
npm run anchor:deploy
```

## Testing

Anchor tests live in `tests/` and run with `anchor test`:

```bash
anchor test
```

Test configuration uses `tests/tsconfig.json` and ts-mocha.

## Deployment

1. Deploy staking program and update program ID in:
   - `programs/staking/src/lib.rs` (`declare_id!`)
   - `Anchor.toml` program IDs
   - `apps/api/.env` (STAKING_PROGRAM_ID)
   - `apps/web/.env.local` (NEXT_PUBLIC_STAKING_PROGRAM_ID)

2. Configure production database and run Prisma migrations.
3. Set API secrets and keypairs in `apps/api/.env`.
4. Enable scheduler with `ENABLE_SCHEDULER=true` for automation jobs.

## Troubleshooting

- If `anchor test` fails, ensure Solana CLI and Anchor are installed and the local validator is running.
- If `tsc` is missing, install TypeScript in the workspace: `npm install` from the repo root.
- If API calls fail in dev, confirm `NEXT_PUBLIC_API_URL` and CORS origins.

## Roadmap

- Real on chain staking instructions wired into API transactions
- Raydium LP integration for graduated tokens
- Indexer integration for price and holder analytics
- Governance and creator reputation system

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit with clear messages
4. Open a pull request

## License

MIT License. See [LICENSE](LICENSE) for details.

Built by KR8TIV. Powered by Jarvis.

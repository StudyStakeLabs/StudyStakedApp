# StudyStake - Quick Start Guide

Get the StudyStake dApp running in under 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Rust installed (for IOTA CLI)
- [ ] IOTA wallet extension (optional for now)

## Step 1: Frontend Setup (2 minutes)

```bash
# Clone and navigate
cd discipline-app-mvp

# Install dependencies
pnpm install

# Create environment file
cp .env.local.example .env.local

# Start development server
pnpm dev
```

Visit http://localhost:3000 - you should see the dashboard!

**Note**: Wallet connection is simulated for now. Smart contract functions will log to console.

## Step 2: Try the App (Free Mode)

1. Click "Start New Task"
2. Enter task name (e.g., "Study for 25 minutes")
3. Choose category (Study)
4. Set duration (25 minutes)
5. Select "Free Mode"
6. Click "Start Task"

You should see:
- Countdown timer
- Progress bar
- Task information

**Test tab tracking**: Switch to another tab for 20 seconds and come back. You should see a warning!

## Step 3: Smart Contract Setup (Optional, 10 minutes)

### Install IOTA CLI

```bash
# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install IOTA CLI
cargo install --locked --git https://github.com/iotaledger/iota iota
```

### Configure Testnet

```bash
# Setup testnet
iota client new-env --alias testnet --rpc https://api.testnet.iota.org:443
iota client switch --env testnet

# Get testnet tokens (faucet)
iota client faucet
```

### Build and Test Contract

```bash
cd smart-contract

# Build
iota move build

# Run tests
iota move test
```

You should see:
```
[ PASS    ] studystake::studystake_tests::test_stake_task
[ PASS    ] studystake::studystake_tests::test_complete_task
[ PASS    ] studystake::studystake_tests::test_forfeit_task
Test result: OK. Total tests: 3; passed: 3; failed: 0
```

### Deploy Contract

```bash
# Run deployment script
./deploy.sh

# Or manually:
iota client publish --gas-budget 100000000
```

**Important**: Copy the Package ID from the output!

### Update Frontend Config

Edit `discipline-app-mvp/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE
```

Restart the dev server:
```bash
cd discipline-app-mvp
pnpm dev
```

## Step 4: Test Stake Mode (with contract deployed)

1. Click "Connect Wallet" (currently simulated)
2. Click "Start New Task"
3. Enter task details
4. Select "Stake Mode"
5. Enter stake amount (e.g., 1 IOTA)
6. Choose a charity
7. Click "Start Task"

The app will:
- Call the smart contract (currently logs to console)
- Create the task locally
- Start the timer

## Common Issues & Solutions

### "IOTA CLI not found"
```bash
# Make sure cargo/bin is in your PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### "Port 3000 already in use"
```bash
# Kill the process or use a different port
pnpm dev -- -p 3001
```

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

### Contract build errors
```bash
# Make sure you're in the smart-contract directory
cd smart-contract
iota move build
```

## What's Next?

### Explore Features
- [ ] Try both Free and Stake modes
- [ ] Test tab visibility tracking
- [ ] Check task history
- [ ] View your discipline score and streak

### Development
- [ ] Read the main README.md for architecture details
- [ ] Check out the Move contract code in `smart-contract/sources/`
- [ ] Explore frontend components in `discipline-app-mvp/components/`

### Customize
- [ ] Update charity addresses in `lib/charities.ts` with real IOTA addresses
- [ ] Modify the neobrutalism theme in `app/globals.css`
- [ ] Add more charities to the list
- [ ] Adjust tab tracking thresholds in `hooks/use-tab-visibility.ts`

### Integrate Real Wallet
- [ ] Research IOTA wallet adapters
- [ ] Update `components/wallet-connect.tsx`
- [ ] Implement actual transaction signing in `lib/iota-client.ts`

## Need Help?

- **Documentation**: See main [README.md](../README.md)
- **Contract docs**: See [smart-contract/README.md](../smart-contract/README.md)
- **Issues**: Open an issue on GitHub
- **IOTA docs**: https://docs.iota.org

## Quick Commands Reference

```bash
# Frontend
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm lint         # Run linter

# Smart Contract
iota move build   # Build contract
iota move test    # Run tests
./deploy.sh       # Deploy to network

# IOTA Client
iota client envs              # List environments
iota client active-address    # Show active address
iota client gas               # Show gas objects
iota client faucet            # Request testnet tokens
```

---

**Ready to build discipline? Let's go! 🔥**

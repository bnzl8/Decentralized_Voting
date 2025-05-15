# Decentralized Corporate Voting System

A blockchain-based voting system that enables anonymous corporate voting using Ethereum smart contracts. This system allows for multiple-choice polls and uses a whitelist mechanism for access control.

## Features

- Multiple-choice polls with customizable options
- Whitelist-based access control
- Anonymous voting through blockchain
- Real-time poll results
- Admin controls for poll management
- MetaMask integration for wallet connection
- No database required - all data stored on blockchain

## Prerequisites

- Node.js (v18 or higher)
- MetaMask browser extension
- Git

## Quick Start

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start the local Hardhat network (in a terminal):
```bash
npx hardhat node
```

3. Deploy the contracts (in a new terminal):
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

4. Start the React application:
```bash
npm start
```

The application will be available at http://localhost:3000

## Configuration

### MetaMask Setup
1. Install MetaMask browser extension
2. Add Hardhat Local Network to MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

### Important Addresses
- Admin/Deployer Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- This address has admin privileges to:
  - Add/remove addresses to whitelist
  - Create new polls
  - Manage existing polls

## Usage

### As an Admin
1. Connect MetaMask using the deployer account
2. You can:
   - Add addresses to whitelist
   - Create new polls
   - End active polls
   - View poll results

### As a Voter
1. Connect your MetaMask wallet
2. Ensure your address is whitelisted
3. You can:
   - View active polls
   - Cast votes (one vote per poll)
   - View poll results

## Troubleshooting

### Common Issues
1. "Not Whitelisted" message
   - Ensure your wallet address is added to the whitelist by the admin
   - Check if you're connected with the correct MetaMask account

2. Wallet Connection Issues
   - Make sure MetaMask is configured for Hardhat Local Network (Chain ID: 1337)
   - Ensure the local Hardhat node is running

3. Transaction Errors
   - Check if you have enough ETH in your account
   - Make sure you're connected to the correct network

### Development Commands

```bash
# Start local blockchain
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# Start frontend
npm start

# Run tests
npx hardhat test
```

## Project Structure

- `contracts/` - Smart contract source files
  - `Whitelist.sol` - Manages voter access control
  - `Voting.sol` - Handles poll creation and voting logic
- `scripts/` - Deployment and utility scripts
- `src/` - Frontend React application
  - `contexts/` - React context providers
  - `components/` - React components
  - `utils/` - Utility functions and constants
- `test/` - Contract test files

## License

MIT "# Decentralized_Voting" 

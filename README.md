# 🎮 Ghee Khatam - Zero-Knowledge Strategy Game

<div align="center">

![Ghee Khatam Banner](https://img.shields.io/badge/ZK--Powered-Game-green?style=for-the-badge)
![Sepolia Testnet](https://img.shields.io/badge/Network-Sepolia-blue?style=for-the-badge)
![Hackathon](https://img.shields.io/badge/StackTooDeep-v3.0-purple?style=for-the-badge)

**The world's first server-authoritative Zero-Knowledge strategy game where trust is mathematical, not assumed.**

[Live Demo](#) • [Documentation](#features) • [Architecture](#architecture) • [Team](#team)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [The Problem We Solve](#the-problem-we-solve)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Game Mechanics](#game-mechanics)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Team](#team)
- [Acknowledgments](#acknowledgments)

---

## 🎯 Overview

**Ghee Khatam** is a groundbreaking multiplayer strategy game that combines blockchain technology with Zero-Knowledge proofs to create a trustless, verifiable gaming experience. Unlike traditional online games where players must trust the server, our game cryptographically proves every move is valid without revealing hidden information.

Built for **StackTooDeep v3.0** hackathon organized by the Blockchain Society of IIT Roorkee.

---

## 🔍 The Problem We Solve

### Traditional Online Gaming Issues:
- **Server Trust**: Players must blindly trust game servers
- **Hidden State**: No way to verify fairness of hidden information
- **Cheating**: Server-side manipulation is undetectable
- **Centralization**: Single point of failure and control

### Our Solution:
- **ZK-SNARKs**: Cryptographically prove move validity without revealing the map
- **Blockchain Verification**: All game states are verifiable on-chain
- **Trustless Gameplay**: Math, not trust, ensures fairness
- **Transparency**: Open-source smart contracts and circuits

---

## ✨ Features

### 🔐 Zero-Knowledge Proofs
- **Move Validation**: Every move generates a ZK proof
- **Hidden Information**: Map remains secret while proving moves are valid
- **Cryptographic Security**: Uses Groth16 proving system via SnarkJS
- **Optimistic Bundling**: Gas-efficient batch proof submission

### 🎮 Core Gameplay
- **Hexagonal Grid**: Navigate a procedurally generated map
- **Strategic Cards**: 5 unique power-up cards
  - 🚪 **RAM Break**: Bypass walls instantly
  - 📡 **Sonar Ping**: Reveal hidden tiles  
  - 🔒 **Block Cage**: Lock opponent's doors
  - ⏭️ **Skip Turn**: Disable opponent's next move
  - 💥 **Ink Blast**: Reduce opponent's visibility

### 💰 Token Economy
- **GKH Coin (ERC-20)**: In-game currency
- **ETH Bridge**: Deposit ETH to mint GKH tokens
- **Token Burn**: Redeem GKH back to ETH
- **Card Market**: Purchase strategic cards with GKH

### 🏆 NFT Rewards
- **Winner's Badge**: Dynamic ERC-721 NFT for victors
- **On-Chain Proof**: Victory certified by smart contract
- **Collectible**: Unique metadata per match

### 🌐 Real-Time Multiplayer
- **WebSocket Communication**: Instant game updates
- **Matchmaking System**: Auto-pair with opponents
- **Reconnection Support**: Resume games after disconnect
- **Turn-Based Strategy**: Fair, provably valid moves

---

## 🛠️ Tech Stack

### Frontend
```
React 19.2.0          - UI Framework
Phaser 3.90.0         - Game Engine
Vite 7.2.4            - Build Tool
TailwindCSS 3.4.18    - Styling
RainbowKit 2.2.10     - Wallet Integration
Wagmi 2.19.5          - Ethereum Hooks
```

### Backend
```
Node.js + Express 5.2.1  - API Server
WebSocket (ws 8.19.0)    - Real-time Communication
MongoDB                  - Database
JWT                      - Authentication
bcrypt                   - hash+salt
```

### Blockchain
```
Solidity ^0.8.18      - Smart Contracts
Foundry               - Contract Development
Sepolia Testnet       - Deployment Network
OpenZeppelin          - Contract Libraries
```

### Zero-Knowledge
```
Circom 2.0.0          - Circuit Language
SnarkJS 0.7.6         - Proof Generation
Groth16               - Proving System
Poseidon Hash         - Cryptographic Hashing
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GHEE KHATAM SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React Frontend │────▶│  Express Backend │────▶│ MongoDB Database │
│  (Phaser Game)   │◀────│  (WebSocket API) │◀────│  (Game State)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  Wallet (Wagmi)  │     │  ZK Proof Gen    │
│  RainbowKit UI   │     │  (SnarkJS)       │
└──────────────────┘     └──────────────────┘
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Sepolia Testnet  │
         │  Smart Contracts │
         │ • GKH Token      │
         │ • Game Ledger    │
         │ • NFT Minter     │
         └──────────────────┘
```

### Data Flow: Move Validation

```
1. Player clicks hex tile
   └─▶ 2. Frontend calculates ZK circuit inputs
       └─▶ 3. SnarkJS generates proof (~100ms)
           └─▶ 4. Send move + proof to backend
               └─▶ 5. Backend validates proof
                   └─▶ 6. Update game state
                       └─▶ 7. Broadcast to both players
                           └─▶ 8. (End of match) Submit bundle to blockchain
```

---

## 🎲 Game Mechanics

### Map Generation
- **4x5 Hexagonal Grid**: Each tile has 6 potential doors
- **Random Doors**: 75% chance each door is open
- **Hidden Treasure**: Random winning tile (not revealed)
- **Cryptographic Commitment**: Map hash published at game start

### Turn System
1. **Move Phase**: Select adjacent tile
2. **Proof Generation**: Client creates ZK proof
3. **Validation**: Server verifies move is legal
4. **Update**: Position broadcast to both players
5. **Win Condition**: First to reach treasure tile

### ZK Circuit Logic
```circom
// Simplified RAM Move Circuit
template RamMove(rows, cols) {
    // PUBLIC: Visible to everyone
    signal input oldX, oldY, newX, newY;
    signal input mapHash;
    signal input ramActive;
    
    // PRIVATE: Only known to server
    signal input mapGrid[rows][cols];
    signal input salt;
    
    // Verify map integrity
    mapHash === hash(mapGrid, salt);
    
    // Verify move is 1 tile away
    (newX - oldX)² + (newY - oldY)² === 1;
    
    // Verify wall logic
    wallAtDest * (1 - ramActive) === 0;
}
```

---

## 📜 Smart Contracts

### 1️⃣ GKH Token (ERC-20)
```solidity
function deposit() payable        // Mint GKH with ETH
function burnTokens(uint256)      // Burn GKH for ETH
EXCHANGE_RATE = 10000            // 1 ETH = 10,000 GKH
```

### 2️⃣ Game Ledger
```solidity
function deposit(gameId, amount)     // Escrow tokens
function declareWinner(gameId, addr) // on-chain
function withdraw(gameId)            // Winner claims pot
```

### 3️⃣ NFT Minter (ERC-721)
```solidity

function mintNft()   // Mint victory NFT
```

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js >= 18.0.0
MongoDB
MetaMask or compatible wallet
Sepolia ETH (from faucet)
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ghee-khatam

# Install backend dependencies
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# Install frontend dependencies
cd ../frontend
npm install

# Install Phaser game dependencies
cd ../game-game
npm install
```

### Running Locally

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
npm run dev
# Server runs on http://localhost:8000

# Terminal 3: Start Game Server
cd game-game
node server.js
# WebSocket server on ws://localhost:8080

# Terminal 4: Start Frontend
cd frontend
npm run dev
# React app on http://localhost:5173
```

### Compile ZK Circuits (Optional)

```bash
cd backend/zk
chmod +x scripts/compile.sh
./scripts/compile.sh
```

---

## 🧪 Testing

```bash
# Test smart contracts
cd foundry
forge test

# Test ZK circuits
cd backend
node test_integration.js

# Run backend tests
cd backend
npm test
```

---

## 🗺️ Roadmap

- [x] Core game mechanics
- [x] ZK proof generation
- [x] Token economy
- [x] NFT rewards
- [ ] Proof verification on-chain
- [ ] Mobile app (React Native)
- [ ] Tournament mode
- [ ] Leaderboards
- [ ] Mainnet deployment

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/TathagatGupta98">
        <img src="https://github.com/TathagatGupta98.png" width="100px;" alt=""/>
        <br /><sub><b>TathagatGupta98</b></sub>
      </a>
      <br />ZK Circuits & Smart Contracts
    </td>
    <td align="center">
      <a href="https://github.com/Ibrahim2750mi">
        <img src="https://github.com/Ibrahim2750mi.png" width="100px;" alt=""/>
        <br /><sub><b>Ibrahim2750mi</b></sub>
      </a>
      <br />Backend, Game Logic, Assets, Frontend
    </td>
    <td align="center">
      <a href="https://github.com/justwasif">
        <img src="https://github.com/justwasif.png" width="100px;" alt=""/>
        <br /><sub><b>justwasif</b></sub>
      </a>
      <br />Frontend & Blockchain Integration
    </td>
  </tr>
</table>

---

## 🏆 Acknowledgments

Built for **StackTooDeep v3.0** hackathon organized by:

<div align="center">

**Blockchain Society**  
**IIT Roorkee**

</div>

### Technologies Used
- [Phaser](https://phaser.io/) - Game engine
- [SnarkJS](https://github.com/iden3/snarkjs) - ZK proof library
- [Circom](https://docs.circom.io/) - Circuit compiler
- [OpenZeppelin](https://www.openzeppelin.com/) - Smart contract libraries
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection UI

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links
- **Documentation**: [Coming Soon]
- **Video Demo**: [Coming Soon]

---

<div align="center">

**Made with ❤️ for StackTooDeep v3.0**

*Trust is mathematical, not assumed.*

</div>

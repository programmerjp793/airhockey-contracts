// hardhat.config.js
// Hardhat configuration for Puck Sense AI smart contracts.
// Network: Polygon Amoy Testnet (chainId 80002)
// Solidity: 0.8.20
//
// ─── Required .env variables ─────────────────────────────────────────────────
//   DEPLOYER_PRIVATE_KEY      Private key of the wallet paying gas for deploy
//   BACKEND_SIGNER_ADDRESS    Address of the Node.js backend wallet
//   COMPANY_WALLET_ADDRESS    Treasury wallet that receives initial TTK supply
//   POLYGONSCAN_API_KEY       From polygonscan.com (free) — for contract verify
//   POLYGON_AMOY_RPC_URL      Optional custom RPC (defaults to public endpoint)
//
// ─── Usage ───────────────────────────────────────────────────────────────────
//   npx hardhat compile
//   npx hardhat test
//   npx hardhat run scripts/deploy.js --network polygonAmoy
//   npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS> <ARGS>

import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Validate critical env vars before config loads ───────────────────────────
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY   || "";
const POLYGONSCAN_API_KEY  = process.env.POLYGONSCAN_API_KEY     || "";
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL   || "https://rpc-amoy.polygon.technology/";

if (!DEPLOYER_PRIVATE_KEY) {
  console.warn("⚠️  DEPLOYER_PRIVATE_KEY not set in .env — deploy will fail.");
}

// ← FIXED: removed ": HardhatUserConfig" type annotation (TypeScript only)
// ← FIXED: removed "import { HardhatUserConfig } from hardhat/config" (not needed in .js)
const config = {

  // ─── Solidity Compiler ──────────────────────────────────────────────────────
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  // ─── Networks ───────────────────────────────────────────────────────────────
  networks: {

    hardhat: {
      chainId: 31337,
    },

    polygonAmoy: {
      url:      POLYGON_AMOY_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY.replace(/^0x/, "")}`] : [],
      chainId:  80002,
      gasPrice: "auto",
      timeout:  60000,
    },
  },

  // ─── Etherscan / Polygonscan Verification ────────────────────────────────────
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL:     "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  // ─── Paths ──────────────────────────────────────────────────────────────────
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  // ─── Mocha ──────────────────────────────────────────────────────────────────
  mocha: {
    timeout: 60000,
  },
};

export default config;
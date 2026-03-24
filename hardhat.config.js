// ─── REPLACE: hardhat.config.js ─────────────────────────────────────────────
// Changed: polygon amoy → ethereum sepolia
// ────────────────────────────────────────────────────────────────────────────

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // ── Local dev ──────────────────────────────────────────────────────────
    hardhat: {
      chainId: 31337,
    },

    // ── Ethereum Sepolia Testnet (REPLACES polygon amoy) ───────────────────
    sepolia: {
      url:      process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/220b07a186e045deafacb03f594bb9d0",
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
      chainId:  11155111,
      gasPrice: "auto",
      timeout:  120000,
    },
  },

  etherscan: {
    // Use Etherscan V2 API - single API key for all networks
    apiKey: process.env.ETHERSCAN_API_KEY || "D7PWDIPXT2VYY6WGURCJ2YUJP4ANR197N2"
  },

  gasReporter: {
    enabled:  process.env.REPORT_GAS === "true",
    currency: "USD",
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};

// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network sepolia
// Deploys only SmartStore (pure purchase flow - no reward system)

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const companyTreasury = process.env.COMPANY_WALLET_ADDRESS;

  if (!companyTreasury)
    throw new Error("Set COMPANY_WALLET_ADDRESS in .env");

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AirHockey — SmartStore Deployment (Sepolia)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Deployer:        ", deployer.address);
  console.log("Company Treasury:", companyTreasury);
  console.log("Deployer ETH:    ", ethers.formatEther(balance), "ETH\n");

  // Deploy SmartStore only (pure purchase flow)
  console.log("Deploying SmartStore...");
  const SmartStore = await ethers.getContractFactory("SmartStore");
  const store      = await SmartStore.deploy(companyTreasury);
  await store.waitForDeployment();
  const storeAddr = await store.getAddress();
  console.log("     ✅ SmartStore:", storeAddr);

  // Print seeded items
  const storeItems = await store.getAllItems();
  console.log("\n📦 Seeded Store Items:");
  storeItems.forEach(item => {
    console.log(`   [${item.id}] ${item.name} — ${ethers.formatEther(item.price)} ETH`);
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Copy to airhockey-backend/.env");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`SMART_STORE_ADDRESS=${storeAddr}`);
  console.log(`REWARD_ENGINE_ADDRESS=`);

  console.log("\n🔗 Verify on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${storeAddr} "${companyTreasury}"`);
  console.log("\n✅ Done! Pure ETH purchase flow.\n");
}

main().catch((err) => { console.error(err); process.exit(1); });

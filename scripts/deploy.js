// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network sepolia

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const companyTreasury = process.env.COMPANY_WALLET_ADDRESS;
  const backendSigner   = process.env.BACKEND_SIGNER_ADDRESS;

  if (!companyTreasury || !backendSigner)
    throw new Error("Set COMPANY_WALLET_ADDRESS and BACKEND_SIGNER_ADDRESS in .env");

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AirHockey — Ethereum Sepolia (Native ETH)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Deployer:        ", deployer.address);
  console.log("Company Treasury:", companyTreasury);
  console.log("Backend Signer:  ", backendSigner);
  console.log("Deployer ETH:    ", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy RewardEngine (seed with 0.01 ETH reward pool)
  console.log("1/2  Deploying RewardEngine...");
  const RewardEngine = await ethers.getContractFactory("RewardEngine");
  const engine       = await RewardEngine.deploy(
    companyTreasury, backendSigner,
    { value: ethers.parseEther("0.01") }
  );
  await engine.waitForDeployment();
  const engineAddr = await engine.getAddress();
  console.log("     ✅ RewardEngine:", engineAddr);
  console.log("     💰 Seeded with 0.01 ETH reward pool");

  // 2. Deploy SmartStore
  console.log("2/2  Deploying SmartStore...");
  const SmartStore = await ethers.getContractFactory("SmartStore");
  const store      = await SmartStore.deploy(companyTreasury);
  await store.waitForDeployment();
  const storeAddr = await store.getAddress();
  console.log("     ✅ SmartStore:", storeAddr);

  // Print seeded items
  const storeItems = await store.getAllItems();
  console.log("\n📦 Seeded Store Items:");
  storeItems.forEach(item => {
    console.log(`   [${item.id}] ${item.name} — ${ethers.formatEther(item.priceETH)} ETH` +
      (item.tier > 0 ? ` (Tier ${item.tier})` : ""));
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Copy to airhockey-contracts/.env AND airhockey-backend/.env");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`REWARD_ENGINE_ADDRESS=${engineAddr}`);
  console.log(`SMART_STORE_ADDRESS=${storeAddr}`);

  console.log("\n🔗 Verify on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${engineAddr} "${companyTreasury}" "${backendSigner}"`);
  console.log(`npx hardhat verify --network sepolia ${storeAddr} "${companyTreasury}"`);
  console.log("\n✅ Done! No approve() needed — pure native ETH.\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
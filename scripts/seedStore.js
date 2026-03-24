// scripts/seedStore.js
// Run: npx hardhat run scripts/seedStore.js --network sepolia

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const storeAddr  = process.env.SMART_STORE_ADDRESS;

  if (!storeAddr) throw new Error("SMART_STORE_ADDRESS not set in .env");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Seeding SmartStore items on Sepolia");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Deployer:   ", deployer.address);
  console.log("SmartStore: ", storeAddr);

  const SmartStore = await ethers.getContractFactory("SmartStore");
  const store      = SmartStore.attach(storeAddr);

  // Check existing items first
  const existing = await store.getAllItems();
  console.log(`\nExisting items: ${existing.length}`);

  if (existing.length > 0) {
    console.log("Items already seeded:");
    existing.forEach(item => {
      console.log(`  [${item.id}] ${item.name} — ${ethers.formatEther(item.priceETH)} ETH`);
    });
    console.log("\n⚠ Store already has items. Skipping seed.");
    return;
  }

  // Store items to add
  const items = [
    {
      name:      "Wallet Slot Upgrade I",
      itemType:  "wallet_upgrade",
      priceETH:  ethers.parseEther("0.001"),   // 0.001 ETH
      pricePHP:  15000,                         // ₱150.00 (in centavos)
      tier:      1,
    },
    {
      name:      "Wallet Slot Upgrade II",
      itemType:  "wallet_upgrade",
      priceETH:  ethers.parseEther("0.003"),   // 0.003 ETH
      pricePHP:  45000,                         // ₱450.00
      tier:      2,
    },
    {
      name:      "AI Replay Viewer",
      itemType:  "ai_replay",
      priceETH:  ethers.parseEther("0.001"),   // 0.001 ETH
      pricePHP:  9900,                          // ₱99.00
      tier:      0,
    },
    {
      name:      "Custom Puck Skin",
      itemType:  "custom_skin",
      priceETH:  ethers.parseEther("0.0006"),  // 0.0006 ETH
      pricePHP:  5900,                          // ₱59.00
      tier:      0,
    },
  ];

  console.log(`\nAdding ${items.length} items...\n`);

  for (const item of items) {
    process.stdout.write(`  Adding "${item.name}"... `);
    const tx = await store.addItem(
      item.name,
      item.itemType,
      item.priceETH,
      item.pricePHP,
      item.tier
    );
    await tx.wait(1);
    console.log(`✅ tx: ${tx.hash}`);
  }

  // Verify
  const seeded = await store.getAllItems();
  console.log(`\n📦 Seeded ${seeded.length} items:`);
  seeded.forEach(item => {
    console.log(`  [${item.id}] ${item.name} — ${ethers.formatEther(item.priceETH)} ETH | tier=${item.tier} | active=${item.active}`);
  });

  console.log("\n✅ Store seeding complete!\n");
  console.log("Test: https://airhockey-backend.onrender.com/api/store/items\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
// scripts/test-transaction.js
// Test transactions with the deployed SmartStore contract using address from .env

const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.SMART_STORE_ADDRESS;

  if (!contractAddress) {
    throw new Error("SMART_STORE_ADDRESS not found in .env file");
  }

  console.log("=== Testing SmartStore Transaction ===\n");
  console.log("Using Contract Address:", contractAddress);

  // Get provider and wallet
  const provider = new hre.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new hre.ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  console.log("Wallet Address:", wallet.address);

  // Attach to deployed contract
  const SmartStore = await hre.ethers.getContractFactory("SmartStore");
  const contract = SmartStore.connect(wallet).attach(contractAddress);

  // Get contract info
  const treasury = await contract.treasury();
  console.log("Treasury Address:", treasury);

  // Check if already owns item - try item 2 if item 1 is already owned
  let itemId = 1;
  let alreadyOwns = await contract.hasPlayerBoughtItem(wallet.address, itemId);
  if (alreadyOwns) {
    itemId = 2; // Try item 2
    alreadyOwns = await contract.hasPlayerBoughtItem(wallet.address, itemId);
  }
  console.log("Already owns Item", itemId, ":", alreadyOwns);

  // Get item details for the selected item
  const item = await contract.getItem(itemId);
  console.log("\n📦 Item", itemId, "Details:");
  console.log("  Name:", item.name);
  console.log("  Price:", hre.ethers.formatEther(item.price), "ETH");

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log("\n💰 Wallet Balance:", hre.ethers.formatEther(balance), "ETH");

  if (!alreadyOwns && balance >= item.price) {
    console.log("\n🛒 Attempting to purchase Item", itemId, "...");

    try {
      const tx = await contract.buyItem(itemId, { value: item.price });
      console.log("\n🔗 Transaction Hash:", tx.hash);
      console.log("🔍 View on Etherscan: https://sepolia.etherscan.io/tx/" + tx.hash);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());

      // Verify ownership
      const nowOwns = await contract.hasPlayerBoughtItem(wallet.address, 1);
      console.log("Now owns Item 1:", nowOwns);

    } catch (error) {
      console.error("❌ Transaction failed:", error.message);
    }
  } else {
    if (alreadyOwns) {
      console.log("⚠️ Already owns this item");
    } else {
      console.log("⚠️ Insufficient balance for purchase");
    }
  }

  // Get owned items
  const ownedItems = await contract.getPlayerItems(wallet.address);
  console.log("\n📦 Owned Items:", ownedItems.map(id => id.toString()));

  console.log("\n✅ Transaction test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
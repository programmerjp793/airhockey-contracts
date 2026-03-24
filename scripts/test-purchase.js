const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.SMART_STORE_ADDRESS || "0x22EF35Ea8a43Ead079A74Eb062aF2a30f23A15CB";
  
  // Get provider and wallet
  const provider = new hre.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new hre.ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  
  // Create a random player wallet for testing
  const playerWallet = hre.ethers.Wallet.createRandom().connect(provider);
  
  const admin = wallet;
  const player = playerWallet;
  
  console.log("=== Testing SmartStore Purchase Transaction ===\n");
  
  console.log("Admin (Treasury):", admin.address);
  console.log("Player:", player.address);
  
  const SmartStore = await hre.ethers.getContractFactory("SmartStore");
  const contract = SmartStore.attach(contractAddress);
  
  // Get item 1 details
  const item = await contract.getItem(1);
  console.log("\n📦 Item 1 Details:");
  console.log("  Name:", item.name);
  console.log("  Price:", hre.ethers.formatEther(item.price), "ETH");
  console.log("  Available:", item.isAvailable);
  
  // Check player's initial balance
  const initialBalance = await hre.ethers.provider.getBalance(player.address);
  console.log("\n💰 Player Initial Balance:", hre.ethers.formatEther(initialBalance), "ETH");
  
  // Get treasury initial balance
  const treasuryAddress = await contract.treasury();
  const initialTreasuryBalance = await hre.ethers.provider.getBalance(treasuryAddress);
  console.log("💰 Treasury Initial Balance:", hre.ethers.formatEther(initialTreasuryBalance), "ETH");
  
  // Check if player already owns item 1
  const alreadyOwned = await contract.hasPlayerBoughtItem(player.address, 1);
  console.log("\n🔍 Player already owns Item 1:", alreadyOwned);
  
  if (!alreadyOwned) {
    console.log("\n🛒 Attempting to buy Item 1...");
    
    // Buy item with ETH
    const price = item.price;
    try {
      const tx = await contract.connect(player).buyItem(1, {
        value: price
      });
      
      console.log("\n🔗 Transaction Hash:", tx.hash);
      console.log("🔍 View on Etherscan: https://sepolia.etherscan.io/tx/" + tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("\n✅ Transaction Successful!");
      console.log("📦 Block Number:", receipt.blockNumber);
      console.log("⛽ Gas Used:", receipt.gasUsed.toString());
      
      // Check ownership after purchase
      const newOwnership = await contract.hasPlayerBoughtItem(player.address, 1);
      console.log("\n🔍 Player now owns Item 1:", newOwnership);
      
      // Check new balances
      const finalBalance = await hre.ethers.provider.getBalance(player.address);
      const finalTreasuryBalance = await hre.ethers.provider.getBalance(treasuryAddress);
      
      console.log("\n💰 Player Final Balance:", hre.ethers.formatEther(finalBalance), "ETH");
      console.log("💰 Treasury Final Balance:", hre.ethers.formatEther(finalTreasuryBalance), "ETH");
      console.log("💰 Treasury Received:", hre.ethers.formatEther(finalTreasuryBalance - initialTreasuryBalance), "ETH");
      
    } catch (error) {
      console.log("❌ Transaction Failed:", error.message);
    }
  } else {
    console.log("\n⚠️ Player already owns this item. Test purchase skipped.");
  }
  
  // Get all items owned by player
  const playerItems = await contract.getPlayerItems(player.address);
  console.log("\n📦 Player's Owned Items:", playerItems.map(id => id.toString()));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

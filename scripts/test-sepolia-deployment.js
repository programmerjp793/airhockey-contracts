// scripts/test-sepolia-deployment.js
// Test the deployed SmartStore contract on Sepolia testnet

const hre = require("hardhat");

async function main() {
  // Use the deployed contract address from environment
  const contractAddress = process.env.SMART_STORE_ADDRESS;

  if (!contractAddress) {
    throw new Error("SMART_STORE_ADDRESS not found in .env");
  }

  console.log("=== Testing SmartStore on Sepolia Testnet ===\n");
  console.log("Contract Address:", contractAddress);

  // Get signer from private key
  const provider = new hre.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new hre.ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const admin = wallet;

  // For player, we'll use a random wallet (since we can't get multiple signers on testnet)
  const playerWallet = hre.ethers.Wallet.createRandom().connect(provider);
  const player = playerWallet;

  console.log("Admin/Treasury:", admin.address);
  console.log("Player:", player.address);

  // Attach to deployed contract
  const SmartStore = await hre.ethers.getContractFactory("SmartStore");
  const contract = SmartStore.attach(contractAddress);

  console.log("\n🔍 Checking contract state...");

  // Get all items
  const allItems = await contract.getAllItems();
  console.log("\n📦 All Store Items:");
  allItems.forEach(item => {
    console.log(`  [${item.id}] ${item.name} — ${hre.ethers.formatEther(item.price)} ETH (Available: ${item.isAvailable})`);
  });

  // Check treasury
  const treasury = await contract.treasury();
  console.log("\n💰 Treasury Address:", treasury);

  // Test item details
  console.log("\n🧪 Testing Item Details...");
  const item1 = await contract.items(1);
  console.log("Item 1 via mapping:", {
    id: item1.id.toString(),
    name: item1.name,
    price: hre.ethers.formatEther(item1.price),
    available: item1.isAvailable
  });

  // Test getItem function
  const item1Details = await contract.getItem(1);
  console.log("Item 1 via getItem:", {
    id: item1Details.id.toString(),
    name: item1Details.name,
    price: hre.ethers.formatEther(item1Details.price),
    available: item1Details.isAvailable
  });

  // Check player balance
  const playerBalance = await hre.ethers.provider.getBalance(player.address);
  console.log("\n💰 Player Balance:", hre.ethers.formatEther(playerBalance), "ETH");

  // Check if player owns any items initially
  const initialOwnership = await contract.hasPlayerBoughtItem(player.address, 1);
  console.log("Player owns Item 1 initially:", initialOwnership);

  // Get available items
  const availableItems = await contract.getAvailableItems();
  console.log("\n📦 Available Items Count:", availableItems.length);

  console.log("\n✅ Contract is live and functional on Sepolia!");
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
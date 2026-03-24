const hre = require("hardhat");

async function main() {
  const contractAddress = "0x22EF35Ea8a43Ead079A74Eb062aF2a30f23A15CB";
  
  try {
    const SmartStore = await hre.ethers.getContractFactory("SmartStore");
    const contract = SmartStore.attach(contractAddress);
    
    console.log("✅ SmartStore contract verified on Sepolia!");
    console.log("Contract Address:", contractAddress);
    console.log("Treasury:", await contract.treasury());
    console.log("Next Item ID:", (await contract.nextItemId()).toString());
    
    // Get all items
    const itemCount = (await contract.nextItemId()).toNumber() - 1;
    console.log("\n📦 Items in store:");
    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.getItem(i);
      console.log(`  ID ${i}: ${item.name} - ${hre.ethers.formatEther(item.price)} ETH - Available: ${item.isAvailable}`);
    }
  } catch (error) {
    console.log("❌ Contract verification failed:");
    console.log(error.message);
  }
}

main();

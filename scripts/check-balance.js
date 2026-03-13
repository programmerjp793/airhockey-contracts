const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.05")) {
    console.log("⚠️  WARNING: Balance too low — fund this wallet before deploying");
  } else {
    console.log("✅ Balance sufficient — ready to deploy");
  }
}

main().catch(console.error);
// test/RewardEngine.SmartStore.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RewardEngine (Native ETH)", function () {
  let engine, owner, treasury, backend, player;

  beforeEach(async () => {
    [owner, treasury, backend, player] = await ethers.getSigners();
    const RE = await ethers.getContractFactory("RewardEngine");
    engine   = await RE.deploy(treasury.address, backend.address,
      { value: ethers.parseEther("1.0") });
    await engine.waitForDeployment();
  });

  it("deploys with seeded ETH reward pool", async () => {
    expect(await engine.getRewardPoolBalance()).to.equal(ethers.parseEther("1.0"));
  });

  it("rewards player with ETH", async () => {
    const reward    = ethers.parseEther("0.05");
    const balBefore = await ethers.provider.getBalance(player.address);
    await engine.connect(backend).rewardPlayer(player.address, reward, "match_win");
    const balAfter  = await ethers.provider.getBalance(player.address);
    expect(balAfter - balBefore).to.equal(reward);
  });

  it("reverts if not backend signer", async () => {
    await expect(
      engine.connect(player).rewardPlayer(player.address, 100, "cheat")
    ).to.be.revertedWith("RewardEngine: not backend signer");
  });

  it("reverts if reward pool insufficient", async () => {
    await expect(
      engine.connect(backend).rewardPlayer(player.address, ethers.parseEther("999"), "too_much")
    ).to.be.revertedWith("Insufficient reward pool");
  });

  it("processFiatPurchase records reference", async () => {
    await engine.connect(backend).processFiatPurchase(player.address, 9900, "gcash", "ref_001");
    expect(await engine.isRefProcessed("ref_001")).to.be.true;
  });

  it("prevents double-spend on same reference ID", async () => {
    await engine.connect(backend).processFiatPurchase(player.address, 9900, "gcash", "ref_x");
    await expect(
      engine.connect(backend).processFiatPurchase(player.address, 9900, "gcash", "ref_x")
    ).to.be.revertedWith("Reference already processed");
  });

  it("owner can deposit additional ETH", async () => {
    const before = await engine.getRewardPoolBalance();
    await engine.depositRewardPool({ value: ethers.parseEther("0.5") });
    expect(await engine.getRewardPoolBalance() - before).to.equal(ethers.parseEther("0.5"));
  });
});

describe("SmartStore (Native ETH)", function () {
  let store, owner, treasury, player;

  beforeEach(async () => {
    [owner, treasury, player] = await ethers.getSigners();
    const SS = await ethers.getContractFactory("SmartStore");
    store    = await SS.deploy(treasury.address);
    await store.waitForDeployment();
  });

  it("has 4 seeded store items", async () => {
    expect((await store.getAllItems()).length).to.equal(4);
  });

  it("item 1 costs 0.001 ETH", async () => {
    const item = await store.items(1);
    expect(item.price).to.equal(ethers.parseEther("0.001"));
  });

  it("player purchases Wallet Upgrade I with exact ETH", async () => {
    const price      = ethers.parseEther("0.001");
    const treaBefore = await ethers.provider.getBalance(treasury.address);
    await store.connect(player).buyItem(1, { value: price });
    const treaAfter  = await ethers.provider.getBalance(treasury.address);
    expect(treaAfter - treaBefore).to.equal(price);
    expect(await store.hasPlayerBoughtItem(player.address, 1)).to.be.true;
  });

  it("reverts if wrong ETH amount", async () => {
    await expect(
      store.connect(player).buyItem(1, { value: ethers.parseEther("0.0005") })
    ).to.be.revertedWith("Insufficient ETH payment");
  });

  it("reverts if already owned", async () => {
    await store.connect(player).buyItem(1, { value: ethers.parseEther("0.001") });
    await expect(
      store.connect(player).buyItem(1, { value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Already owned");
  });

  it("getPlayerItems returns owned items", async () => {
    await store.connect(player).buyItem(1, { value: ethers.parseEther("0.001") });
    const owned = await store.getPlayerItems(player.address);
    expect(owned).to.deep.equal([1n]);
  });
});
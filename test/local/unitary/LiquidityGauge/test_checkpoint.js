const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

async function snapshot() {
  return network.provider.send("evm_snapshot", []);
}

async function restore(snapshotId) {
  return network.provider.send("evm_revert", [snapshotId]);
}

describe("LiquidityGauge", function () {
  const YEAR = BigNumber.from(86400 * 365);
  const WEEK = BigNumber.from(86400 * 7);

  const name = "InsureToken";
  const simbol = "Insure";
  const decimal = 18;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  const ten_to_the_21 = BigNumber.from("1000000000000000000000");
  const ten_to_the_20 = BigNumber.from("100000000000000000000");
  const ten_to_the_19 = BigNumber.from("10000000000000000000");
  const ten_to_the_18 = BigNumber.from("1000000000000000000");
  const ten_to_the_17 = BigNumber.from("100000000000000000");
  const ten_to_the_9 = BigNumber.from("1000000000");

  before(async () => {
    //import
    [creator, alice, bob] = await ethers.getSigners();
    const Ownership = await ethers.getContractFactory("Ownership");
    const Token = await ethers.getContractFactory("InsureToken");
    const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
    const GaugeController = await ethers.getContractFactory("GaugeController");
    const LiquidityGauge = await ethers.getContractFactory("LiquidityGauge");
    const TestLP = await ethers.getContractFactory("TestLP");
    const Registry = await ethers.getContractFactory("TestRegistry");
    const Minter = await ethers.getContractFactory("Minter");

    //deploy
    ownership = await Ownership.deploy();
    Insure = await Token.deploy(name, simbol);
    voting_escrow = await VotingEscrow.deploy(
      Insure.address,
      "Voting-escrowed Insure",
      "veInsure",
      "veInsure",
      ownership.address
    );
    gauge_controller = await GaugeController.deploy(
      Insure.address,
      voting_escrow.address,
      ownership.address
    );
    mock_lp_token = await TestLP.deploy(
      "InsureDAO LP token",
      "indexSURE",
      decimal,
      ten_to_the_9
    ); //Not using the actual InsureDAO contract
    registry = await Registry.deploy();
    minter = await Minter.deploy(Insure.address, gauge_controller.address, ownership.address);
    liquidity_gauge = await LiquidityGauge.deploy(
      mock_lp_token.address,
      minter.address,
      ownership.address
    );
  });

  beforeEach(async () => {
    snapshotId = await snapshot();
  });

  afterEach(async () => {
    await restore(snapshotId);
  });

  describe("test_checkpoint", function () {
    it("test_user_checkpoint", async () => {
      await liquidity_gauge.connect(alice).user_checkpoint(alice.address);
    });

    it("test_user_checkpoint_new_period", async () => {
      await liquidity_gauge.connect(alice).user_checkpoint(alice.address);
      await ethers.provider.send("evm_increaseTime", [
        YEAR.mul("11").div("10").toNumber(),
      ]);
      await liquidity_gauge.connect(alice).user_checkpoint(alice.address);
    });

    it("test_user_checkpoint_wrong_account", async () => {
      await expect(
        liquidity_gauge.connect(alice).user_checkpoint(bob.address)
      ).to.revertedWith("dev: unauthorized");
    });
  });
});

import { expect, assert } from "chai";
import { ethers, network } from "hardhat";

// Function
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// Data
import { developmentChains } from "../../helper-hardhat-config";

// Types
import { BasicNftTwo, BasicNftTwo__factory } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

// ----------

describe("BasicNftTwo", function () {
  beforeEach(async () => {
    if (!developmentChains.includes(network.name)) {
      throw new Error(
        "You need to be on a development chain to run unit tests"
      );
    }
  });

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  type DeployFixture = {
    deployer: SignerWithAddress;
    basicNftTwo: BasicNftTwo;
  };
  async function deployBasicNftTwoFixture(): Promise<DeployFixture> {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();

    const basicNftTwoFactory: BasicNftTwo__factory =
      await ethers.getContractFactory("BasicNftTwo");
    const basicNftTwo: BasicNftTwo = await basicNftTwoFactory
      .connect(deployer)
      .deploy();

    return { deployer, basicNftTwo };
  }

  describe("deployments", () => {
    it("Contract should Has name [Dogie]", async function () {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);
      const name: string = await basicNftTwo.name();
      assert.equal(name, "Dogie");
    });
    it("Contract should Has Symbol [DOG]", async function () {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);
      const symbol: string = await basicNftTwo.symbol();
      assert.equal(symbol, "DOG");
    });
    it("Token counter should initialize as 0", async function () {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);
      const tokenCounter: BigNumber = await basicNftTwo.getTokenCounter();
      expect(tokenCounter.eq(0));
    });
  });

  describe("#mintNft", () => {
    it("fails if 0x0 address fire it", async () => {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);
      const tokenCounterBeforeMinting = await basicNftTwo.getTokenCounter();
      try {
        // This promise will fail as zeroAddress cannot fire functions
        await basicNftTwo.connect(ethers.constants.AddressZero).mintNft();
      } catch (error) {
        // We check that tokenCounter doesn't change to be sure that minting did not occuars
        const tokenCounterAfterMinting = await basicNftTwo.getTokenCounter();
        expect(tokenCounterAfterMinting.eq(tokenCounterBeforeMinting));
      }
    });
    it("should fire Transfer event when successful mint", async () => {
      const { deployer, basicNftTwo } = await loadFixture(
        deployBasicNftTwoFixture
      );

      const tokenCounter = await basicNftTwo.getTokenCounter();

      await expect(basicNftTwo.mintNft())
        .to.emit(basicNftTwo, "Transfer")
        .withArgs(ethers.constants.AddressZero, deployer.address, tokenCounter);
    });
    it("should update tokenCounter value and increase it by one", async () => {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);

      const tokenCounterBefore: BigNumber = await basicNftTwo.getTokenCounter();
      await basicNftTwo.mintNft();
      const tokenCounterAfter: BigNumber = await basicNftTwo.getTokenCounter();

      expect(tokenCounterBefore.eq(tokenCounterAfter.sub(1)));
    });
  });

  describe("#tokenURI", () => {
    it("reverts if the token is not existed", async () => {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);
      const tokenCounter = await basicNftTwo.getTokenCounter();
      await expect(
        basicNftTwo.tokenURI(tokenCounter.add(1))
      ).to.be.revertedWithCustomError(
        basicNftTwo,
        "BasicNftTwo__TokenNotExisted"
      );
    });

    it("returns the tokenURI successfully if there is a tokenId existed", async () => {
      const { basicNftTwo } = await loadFixture(deployBasicNftTwoFixture);
      const tokenCounter = await basicNftTwo.getTokenCounter();
      await basicNftTwo.mintNft();
      await basicNftTwo.mintNft();
      await basicNftTwo.mintNft();
      const tokenURI = await basicNftTwo.tokenURI(0);
      assert.equal(
        tokenURI,
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4"
      );
    });
  });
});

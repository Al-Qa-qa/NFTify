import { expect, assert } from "chai";
import { ethers, network } from "hardhat";

// Function
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// Data
import { developmentChains } from "../../helper-hardhat-config";

// Types
import { BasicNft, BasicNft__factory } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

// ----------

describe("BasicNft", function () {
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
    basicNft: BasicNft;
  };
  async function deployBasicNftFixture(): Promise<DeployFixture> {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();

    const basicNftFactory: BasicNft__factory = await ethers.getContractFactory(
      "BasicNft"
    );
    const basicNft: BasicNft = await basicNftFactory.connect(deployer).deploy();

    return { deployer, basicNft };
  }

  describe("deployments", () => {
    it("Contract should Has name [Dogie]", async function () {
      const { basicNft } = await loadFixture(deployBasicNftFixture);
      const name: string = await basicNft.name();
      assert.equal(name, "Dogie");
    });
    it("Contract should Has Symbol [DOG]", async function () {
      const { basicNft } = await loadFixture(deployBasicNftFixture);
      const symbol: string = await basicNft.symbol();
      assert.equal(symbol, "DOG");
    });
    it("Token counter should initialize as 0", async function () {
      const { basicNft } = await loadFixture(deployBasicNftFixture);
      const tokenCounter: BigNumber = await basicNft.getTokenCounter();
      expect(tokenCounter.eq(0));
    });
  });

  describe("#mintNft", () => {
    it("fails if 0x0 address fire it", async () => {
      const { basicNft } = await loadFixture(deployBasicNftFixture);
      const tokenCounterBeforeMinting = await basicNft.getTokenCounter();
      try {
        // This promise will fail as zeroAddress cannot fire functions
        await basicNft.connect(ethers.constants.AddressZero).mintNft();
      } catch (error) {
        // We check that tokenCounter doesn't change to be sure that minting did not occuars
        const tokenCounterAfterMinting = await basicNft.getTokenCounter();
        expect(tokenCounterAfterMinting.eq(tokenCounterBeforeMinting));
      }
    });
    it("should fire Transfer event when successful mint", async () => {
      const { deployer, basicNft } = await loadFixture(deployBasicNftFixture);

      const tokenCounter = await basicNft.getTokenCounter();

      await expect(basicNft.mintNft())
        .to.emit(basicNft, "Transfer")
        .withArgs(ethers.constants.AddressZero, deployer.address, tokenCounter);
    });
    it("should update tokenCounter value and increase it by one", async () => {
      const { basicNft } = await loadFixture(deployBasicNftFixture);

      const tokenCounterBefore: BigNumber = await basicNft.getTokenCounter();
      await basicNft.mintNft();
      const tokenCounterAfter: BigNumber = await basicNft.getTokenCounter();

      expect(tokenCounterBefore.eq(tokenCounterAfter.sub(1)));
    });
  });

  describe("#tokenURI", () => {
    it("reverts if the token is not existed", async () => {
      const { basicNft } = await loadFixture(deployBasicNftFixture);
      const tokenCounter = await basicNft.getTokenCounter();
      await expect(
        basicNft.tokenURI(tokenCounter.add(1))
      ).to.be.revertedWithCustomError(basicNft, "BasicNft__TokenNotExisted");
    });

    it("returns the tokenURI successfully if there is a tokenId existed", async () => {
      const { basicNft } = await loadFixture(deployBasicNftFixture);
      const tokenCounter = await basicNft.getTokenCounter();
      await basicNft.mintNft();
      await basicNft.mintNft();
      await basicNft.mintNft();
      const tokenURI = await basicNft.tokenURI(0);
      assert.equal(
        tokenURI,
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4"
      );
    });
  });
});

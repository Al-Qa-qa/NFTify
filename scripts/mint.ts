import { ethers, network } from "hardhat";

// Functions
import { log } from "../helper-functions";

// Data
import jsonContracts from "../deployed-contracts.json";

// Types
import { BasicNft } from "../typechain-types";
import { BigNumber, ContractTransaction } from "ethers";

// ------------

/**
 * Change the value of the stored item in our contract
 */
async function mintBasicNft(): Promise<void | never> {
  const [signer] = await ethers.getSigners();
  const networkName: string = network.name;
  const contracts = Object(jsonContracts);
  if (!contracts[networkName].BasicNft) {
    throw new Error("Contract is not deployed yet");
  }
  if (networkName === "hardhat") {
    throw new Error("Can't run scripts to hardhat network deployed contract");
  }
  const basicNft: BasicNft = await ethers.getContractAt(
    "BasicNft",
    contracts[networkName].BasicNft,
    signer
  );

  log("Minting NFT...", "title");
  await basicNft.mintNft();

  log("Minted Successfully");

  const tokenCounter: BigNumber = await basicNft.getTokenCounter();

  log("", "separator");
  log(`There are ${tokenCounter} NFTs minted`);
}

mintBasicNft()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

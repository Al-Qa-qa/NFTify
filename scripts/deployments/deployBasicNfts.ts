// Packages
import * as fs from "fs";
import * as path from "path";
import { ethers, network } from "hardhat";

// Functions
import { log, verify } from "../../helper-functions";

// Data
import {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../../helper-hardhat-config";

// Types
import {
  BasicNft,
  BasicNft__factory,
  BasicNftTwo,
  BasicNftTwo__factory,
} from "../../typechain-types";

/**
 * Type of the deployed contract that will be stored in deployed-contracts.json file
 *
 * example:
 *  {
 *    "hardhat": {
 *      "contractName": "contractAddress"
 *    }
 *  }
 */
type DeployedContracts = {
  [key: string]: {
    [key: string]: string;
  };
};

/**
 * Deploy SimpleStorage Contract
 *
 * @param chainId the Id of the network we will deploy on it
 * @returns the deployed contract
 */
async function deployNftMarketplace(chainId: number) {
  const [deployer] = await ethers.getSigners();

  if (developmentChains.includes(network.name)) {
    // Deploy MOCKS if existed
    // You will use chainId to get info of the chain from hardhat-helper-config file
  } else {
    // Do additional thing in case its not a testnet
  }

  // Deploying The Contracts
  // --> Deploying BasicNft contract
  log(`Deploying contract (BasicNft) with the account: ${deployer.address}`);
  const basicNftFactory: BasicNft__factory = await ethers.getContractFactory(
    "BasicNft",
    deployer
  );
  log("Deploying Contract...");
  const basicNft: BasicNft = await basicNftFactory.deploy();
  await basicNft.deployed();
  log(`BasicNft contract deployed to: ${basicNft.address}`);

  // --> Deploy BasicNftTwo contract

  const basicNftTwoFactory: BasicNftTwo__factory =
    await ethers.getContractFactory("BasicNftTwo", deployer);
  log("Deploying Contract...");
  const basicNftTwo: BasicNftTwo = await basicNftTwoFactory.deploy();
  await basicNftTwo.deployed();
  log(`BasicNftTwo contract deployed to: ${basicNft.address}`);

  log("", "separator");

  // Verify contracts
  if (!developmentChains.includes(network.name)) {
    // Verify Contract if it isnt in a development chain
    log("Verifying BasicNft Contract", "title");
    await basicNft.deployTransaction.wait(VERIFICATION_BLOCK_CONFIRMATIONS);
    await verify(basicNft.address, []);
    log("verified successfully");

    log("", "separator");

    log("Verifying BasicNftTwo Contract", "title");
    await basicNftTwo.deployTransaction.wait(VERIFICATION_BLOCK_CONFIRMATIONS);
    await verify(basicNft.address, []);
    log("verified successfully");
  }

  // Storing contract address to connect to it later
  log("Storing contract address", "title");
  const parentDir: string = path.resolve(__dirname, "../../");
  const deployedContractsPath: string = path.join(
    parentDir,
    "deployed-contracts.json"
  );
  const oldContracts: DeployedContracts = JSON.parse(
    fs.readFileSync(deployedContractsPath, "utf8")
  );

  // Add the contract to the network we are deploying on it
  if (!oldContracts[network.name]) {
    oldContracts[network.name] = {};
  }
  oldContracts[network.name].BasicNft = basicNft.address;
  oldContracts[network.name].BasicNftTwo = basicNftTwo.address;

  // Save data in our deployed-contracts file
  fs.writeFileSync(
    deployedContractsPath,
    JSON.stringify(oldContracts, null, 2)
  );
  log("Stored Succesfully");
  log("", "separator");
  return { basicNft, basicNftTwo };
}

export default deployNftMarketplace;

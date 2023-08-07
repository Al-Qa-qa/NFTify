// Packages
import * as fs from 'fs';
import * as path from 'path';
import { ethers, network } from 'hardhat';

// Functions
import { log, verify } from '../../helper-functions';

// Data
import { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } from '../../helper-hardhat-config';

// Types
import { NFTify_Snakes, NFTify_Snakes__factory } from '../../typechain-types';

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
  // --> Deploying Collection contract
  log(`Deploying contract (Birds Collection) with the account: ${deployer.address}`);
  const animalFactory: NFTify_Snakes__factory = await ethers.getContractFactory(
    'NFTify_Snakes',
    deployer
  );
  log('Deploying Contract...');
  const animal: NFTify_Snakes = await animalFactory.deploy();
  await animal.deployed();
  log(`Panda Collection contract deployed to: ${animal.address}`);

  log('', 'separator');

  // Verify contracts
  if (!developmentChains.includes(network.name)) {
    // Verify Contract if it isnt in a development chain
    log('Verifying Animal Contract', 'title');
    await animal.deployTransaction.wait(VERIFICATION_BLOCK_CONFIRMATIONS);
    await verify(animal.address, []);
    log('verified successfully');
  }

  log('', 'separator');

  // Storing contract address to connect to it later
  log('Storing contract address', 'title');
  const parentDir: string = path.resolve(__dirname, '../../');
  const deployedContractsPath: string = path.join(parentDir, 'deployed-contracts.json');
  const oldContracts: DeployedContracts = JSON.parse(
    fs.readFileSync(deployedContractsPath, 'utf8')
  );

  // Add the contract to the network we are deploying on it
  if (!oldContracts[network.name]) {
    oldContracts[network.name] = {};
  }
  oldContracts[network.name].Snakes = animal.address;

  // Save data in our deployed-contracts file
  fs.writeFileSync(deployedContractsPath, JSON.stringify(oldContracts, null, 2));
  log('Stored Succesfully');
  log('', 'separator');
  return { animal };
}

export default deployNftMarketplace;

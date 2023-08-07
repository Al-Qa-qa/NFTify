import { ethers, network } from 'hardhat';

// Functions
import { log } from '../helper-functions';

// Data
import jsonContracts from '../deployed-contracts.json';

// Types
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BasicNft, NFTify as NftMarketplace } from '../typechain-types';
import { BigNumber, ContractTransaction } from 'ethers';

// ------------

const TOKEN_ID: number = 0; // change the tokenId of the NFT item you want to list
const PRICE: BigNumber = ethers.utils.parseEther('0.1');

/**
 * Change the value of the stored item in our contract
 */
async function buyItem(): Promise<void | never> {
  const [, buyer]: SignerWithAddress[] = await ethers.getSigners();
  const networkName: string = network.name;
  const contracts = Object(jsonContracts);
  if (!contracts[networkName].NftMarketplace) {
    throw new Error('Contract is not deployed yet');
  }
  if (networkName === 'hardhat') {
    throw new Error("Can't run scripts to hardhat network deployed contract");
  }
  const nftMarketplace: NftMarketplace = await ethers.getContractAt(
    'NFTify',
    contracts[networkName].NftMarketplace,
    buyer
  );

  const basicNft: BasicNft = await ethers.getContractAt(
    'BasicNft',
    contracts[networkName].BasicNft,
    buyer
  );

  const owner = await basicNft.ownerOf(TOKEN_ID);
  log(`Item is owned by ${owner}`);

  try {
    await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

    log('Item Bought Successfully');
  } catch (error) {
    log('Purching process failed!');
  }

  log('', 'separator');

  const newOwner = await basicNft.ownerOf(TOKEN_ID);

  log(`Item is know owned by ${newOwner}`);
}

buyItem()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

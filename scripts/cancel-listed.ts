import { ethers, network } from 'hardhat';

// Functions
import { log } from '../helper-functions';

// Data
import jsonContracts from '../deployed-contracts.json';

// Types
import { BasicNft, NFTify as NftMarketplace } from '../typechain-types';
import { BigNumber, ContractTransaction } from 'ethers';
import { VERIFICATION_BLOCK_CONFIRMATIONS } from '../helper-hardhat-config';

// ------------

const TOKEN_ID: number = 0; // change the tokenId of the NFT item you want to list
const PRICE: BigNumber = ethers.utils.parseEther('0.1');

/**
 * Change the value of the stored item in our contract
 */
async function listNftItem(): Promise<void | never> {
  const [signer] = await ethers.getSigners();
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
    signer
  );

  const basicNft: BasicNft = await ethers.getContractAt(
    'BasicNft',
    contracts[networkName].BasicNft,
    signer
  );

  // log('Approving item to our marketplace');

  // await basicNft.approve(nftMarketplace.address, TOKEN_ID);

  try {
    // const cancelApprovalTx = await basicNft
    //   .connect(signer)
    //   .approve(ethers.constants.AddressZero, TOKEN_ID);
    const cancelListingTx = await nftMarketplace
      .connect(signer)
      .cancelListing('0x8868cd5fd811aab97ea86397631d1d6b670afdfa', '867');
    console.log('Cancel Approval...');
    // await cancelApprovalTx.wait();
    await cancelListingTx.wait();
    log('Item Canceled Successfully');
  } catch (error) {
    log('ERROR');
    log(error);
    log('----------');
  }

  log('', 'separator');

  const listedItem: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
    basicNft.address,
    TOKEN_ID
  );

  log(
    `Item seller: ${listedItem.seller}\nItem price: ${ethers.utils.formatEther(
      listedItem.price
    )} ETH`
  );
}

listNftItem()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

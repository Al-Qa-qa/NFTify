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

/**
 * Change the value of the stored item in our contract
 */
async function withdraw(): Promise<void | never> {
  const [seller]: SignerWithAddress[] = await ethers.getSigners();
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
    seller
  );

  // const basicNft: BasicNft = await ethers.getContractAt(
  //   "BasicNft",
  //   contracts[networkName].BasicNft,
  //   buyer
  // );

  const salesBalance: BigNumber = await nftMarketplace.getProceeds(seller.address);
  if (salesBalance.eq(0)) {
    throw new Error("Seller has 0 in his balance, so he can't with draw");
  }

  let sellerBalance: BigNumber = await ethers.provider.getBalance(seller.address);
  log(`Seller balance is: ${ethers.utils.formatEther(sellerBalance)} ETH`);

  try {
    await nftMarketplace.connect(seller).withdrawProceeds();

    log('Withdrawed Successfully');
  } catch (error) {
    log('Withdrawal failed!');
    return;
  }

  log('', 'separator');

  sellerBalance = await ethers.provider.getBalance(seller.address);

  log(`Seller balance is: ${ethers.utils.formatEther(sellerBalance)} ETH`);
}

withdraw()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

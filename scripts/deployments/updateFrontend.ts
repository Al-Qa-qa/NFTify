import fs from 'fs';
import { ethers, network } from 'hardhat';

// Funtions
import { log } from '../../helper-functions';

// Data
import jsonContracts from '../../deployed-contracts.json';

// Types
import { BasicNft, BasicNftTwo, NFTify as NftMarketplace } from '../../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  frontEndAbiFile,
  frontEndContractsFile,
  developmentChains,
} from '../../helper-hardhat-config';

// --------------

async function updateFrontEnd(): Promise<void> | never {
  const [signer]: SignerWithAddress[] = await ethers.getSigners();
  const networkName: string = network.name;
  const contracts = Object(jsonContracts);

  if (developmentChains.includes(networkName)) {
    return console.log('You can use development chains in front-end');
  }
  if (!contracts?.[networkName]?.NftMarketplace) {
    // Throwing error if we did't find Contract Address
    throw new Error('Contract is not deployed yet');
  }
  const basicNft: BasicNft = await ethers.getContractAt(
    'BasicNft',
    contracts[networkName].BasicNft,
    signer
  );
  const nftMarketplace: NftMarketplace = await ethers.getContractAt(
    'NFTify',
    contracts[networkName].NftMarketplace,
    signer
  );

  log('Changing frontend files');

  if (fs.existsSync('../frontend/constants')) {
    console.log('The directory exists.');
  } else {
    return console.log('ERROR');
  }

  const apis = {
    BasicNft: JSON.parse(basicNft.interface.format(ethers.utils.FormatTypes.json).toString()),
    NftMarketplace: JSON.parse(
      nftMarketplace.interface.format(ethers.utils.FormatTypes.json).toString()
    ),
  };

  console.log('Updating Files');
  fs.writeFileSync(frontEndAbiFile, JSON.stringify(apis));

  // if (!fs.existsSync(frontEndContractsFile)) {
  //   fs.mkdirSync(frontEndContractsFile, { recursive: true });
  // }
  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contracts));
}

export default updateFrontEnd;

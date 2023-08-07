import { BigNumber } from 'ethers';

type NetworkConfigItem = {
  name: string;
  fundAmount?: BigNumber;
  fee?: string;
  keyHash?: string;
  interval?: string;
  linkToken?: string;
  vrfCoordinator?: string;
  keepersUpdateInterval?: string;
  oracle?: string;
  jobId?: string;
  ethUsdPriceFeed?: string;
};

type NetworkConfigMap = {
  [chainId: string]: NetworkConfigItem;
};

export const networkConfig: NetworkConfigMap = {
  default: {
    name: 'hardhat',
  },
  31337: {
    name: 'localhost',
    ethUsdPriceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  },
  1: {
    name: 'mainnet',
    linkToken: '0x514910771af9ca656af840dff83e8264ecf986ca',
    keepersUpdateInterval: '30',
  },
  11155111: {
    name: 'sepolia',
    linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    ethUsdPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  },
  137: {
    name: 'polygon',
    linkToken: '0xb0897686c545045afc77cf20ec7a532e3120e0f1',
    ethUsdPriceFeed: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
  },
};

export const developmentChains: string[] = ['hardhat', 'localhost'];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

export const frontEndContractsFile = '../frontend-react-moralis/constants/contractAddresses.json';
export const frontEndAbiFile = '../frontend-react-moralis/constants/APIs.json';

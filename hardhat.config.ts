import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

dotenv.config();

// const MAINNET_RPC_URL =
//   process.env.MAINNET_RPC_URL ||
//   'https://eth-mainnet.alchemyapi.io/v2/your-api-key';
// const POLYGON_MAINNET_RPC_URL =
//   process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-mainnet.alchemyapi.io/v2/your-api-key';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// // optional
// const MNEMONIC = process.env.MNEMONIC || 'Your mnemonic';
// const FORKING_BLOCK_NUMBER = process.env.FORKING_BLOCK_NUMBER;

// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'Your etherscan API key';
// const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || 'Your polygonscan API key';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // hardfork: 'merge',
      // // If you want to do some forking set `enabled` to true
      // forking: {
      //   url: MAINNET_RPC_URL,
      //   blockNumber: Number(FORKING_BLOCK_NUMBER),
      //   enabled: false,
      // },
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL !== undefined ? SEPOLIA_RPC_URL : '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 11155111,
    },
    // mainnet: {
    //   url: MAINNET_RPC_URL,
    //   accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //   //   accounts: {
    //   //     mnemonic: MNEMONIC,
    //   //   },
    //   chainId: 1,
    // },
    // polygon: {
    //   url: POLYGON_MAINNET_RPC_URL,
    //   accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //   chainId: 137,
    // },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      // npx hardhat verify --list-networks
      sepolia: ETHERSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      // polygon: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    // currency: 'USD',
    outputFile: 'gas-report.txt',
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  solidity: {
    compilers: [
      {
        version: '0.8.18',
      },
      {
        version: '0.8.7',
      },
      {
        version: '0.6.6',
      },
      {
        version: '0.4.24',
      },
    ],
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
};

export default config;

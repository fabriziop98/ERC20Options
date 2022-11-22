import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Import and configure dotenv
require("dotenv").config();

const config: HardhatUserConfig = {
  solidity:{
    compilers: [
      {
        version: "0.8.9"
      },
      {
        version: "0.8.17"
      },
      {
        version: "0.6.12"
      },
    ]
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  etherscan: {
    apiKey: process.env.ETHER_SCAN,
  },
  networks:{
    hardhat:{
      forking:{
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.MAINNET_ALCHEMY_KEY}`,
        blockNumber:15752251
        
      }
    },
    
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.STAGING_ALCHEMY_KEY}`,
      accounts: [process.env.GOERLI_PRIVATE_KEY as string],
    } 
  } 
};

export default config;

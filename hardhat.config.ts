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
    ]
  },
  networks:{
    hardhat:{
      forking:{
        url: process.env.MAINNET_ALCHEMY_KEY as string
      }
    }
  } 
};

export default config;

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Go to https://www.alchemyapi.io, sign up, create
// a new App in its dashboard, and replace "KEY" with its key
const ALCHEMY_API_KEY = "";

// Replace this private key with your Goerli account private key.
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key.
// Beware: NEVER put real Ether into testing accounts
// Esta es la private key de la cuenta que va a terminar pagando el deploy
const GOERLI_PRIVATE_KEY = "";

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
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  etherscan: {
    apiKey: "",
  },
  networks:{
    hardhat:{
      forking:{
        url: process.env.MAINNET_ALCHEMY_KEY as string
      }
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY],
    }
  } 
};

export default config;

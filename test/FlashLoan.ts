import { ethers, network } from "hardhat";
import { Signer, Wallet, BigNumber } from "ethers";
import { expect } from "chai";

import { ERC20Pool, OptionTrigger } from "../typechain-types";

describe("Excercise option with FlashLoan", () => {

  const DAI = "0x0f4ee9631f4be0a63756515141281a3e2b293bbe";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const buyer = "0x0f4ee9631f4be0a63756515141281a3e2b293bbe"; // with DAI
  const seller = "0x242510fE96a4Fa2d4aC7dE68cD41944cd71d4099"; //with WETH

  let erc20Pool: ERC20Pool;
  let optionTrigger: OptionTrigger;
  let sellerSigner: Signer;
  let buyerSigner: Signer;

  before(async () => { //Setup 
    const ERC20PoolFactory = await ethers.getContractFactory("ERC20Pool");
    erc20Pool = await ERC20PoolFactory.deploy();
    const OptionFactory = await ethers.getContractFactory("OptionTrigger");
    optionTrigger = await OptionFactory.deploy(erc20Pool.address);
    buyerSigner = await ethers.provider.getSigner(buyer);
    sellerSigner = await ethers.provider.getSigner(seller);
  });

  it("Should deploy the contract", async () => {
    expect(erc20Pool).to.not.empty;
    expect(optionTrigger).to.not.empty;
  });

  it("Should Sell option", async () => {

  });
  it("Should Buy Option", async () => {

  });
  it("Should Exercise Option", async () => {

  });


});
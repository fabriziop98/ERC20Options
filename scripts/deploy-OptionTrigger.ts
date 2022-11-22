import { ethers } from "hardhat";

async function main() {
  const erc20PoolAddr = '0x6D5993F08bf89ea3F3Fb5c30635e87583d6211Ad';
  const OptionTrigger = await ethers.getContractFactory("OptionTrigger");
  const optionTrigger = await OptionTrigger.deploy(erc20PoolAddr);

  await optionTrigger.deployed();

  console.log("OptionTrigger deployed to:", optionTrigger.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";

async function main() {
  const erc20PoolAddr = '0x74Ba56ca80527C7291376c5796E8F3b810b9B56B';
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

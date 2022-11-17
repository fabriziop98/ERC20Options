import { ethers } from "hardhat";

async function main() {
  const ERC20Pool = await ethers.getContractFactory("ERC20Pool");
  const erc20Pool = await ERC20Pool.deploy();

  await erc20Pool.deployed();
  console.log("ERC20Pool deployed to:", erc20Pool.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

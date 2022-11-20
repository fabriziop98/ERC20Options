import { ethers, network } from "hardhat";
import { Signer, Wallet, BigNumber } from "ethers";
import { expect } from "chai";
import { ERC20Pool, OptionTrigger, UniswapSwap } from "../typechain-types";
import { IERC20 } from "../typechain-types/interfaces";

describe("Excercise option with FlashLoan", () => {

  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; //Address DAI MAINNET
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";//Address WETH MAINNET
  const buyer = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Address with some DAI
  const seller = "0x242510fE96a4Fa2d4aC7dE68cD41944cd71d4099"; //Address with some WETH
  const ONE_TOKEN = ethers.utils.parseEther("1");
  const swapDAI = ethers.utils.parseEther("1216.252390052043062344");


  let uniswapSwap: UniswapSwap;
  let sellerSigner: Signer;
  let buyerSigner: Signer;
  let owner: Signer;
  let wethToken: IERC20;
  let daiToken: IERC20;

  before(async () => { //Setup 

    [owner] = await ethers.getSigners();
    const uniSwapFactory = await ethers.getContractFactory("UniswapSwap");
    uniswapSwap = await uniSwapFactory.deploy();

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [seller],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [buyer],
    });

    buyerSigner = await ethers.provider.getSigner(buyer);
    sellerSigner = await ethers.provider.getSigner(seller);
    wethToken = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      WETH,
    )) as IERC20;
    daiToken = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      DAI,
    )) as IERC20;


  });

  it("Should deploy the contract", async () => {
    expect(uniswapSwap).to.not.empty;
    //expect(optionTrigger).to.not.empty;
  });

  it("Should swap 1 WETH to 1216.25 DAI", async () => {
    await wethToken.connect(sellerSigner).approve(uniswapSwap.address, ONE_TOKEN);
    console.log("DAI before SWAP", await daiToken.balanceOf(uniswapSwap.address));

    /*     address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin,
    address _to */

    await (uniswapSwap.connect(sellerSigner).swap(
      wethToken.address,
      daiToken.address,
      ONE_TOKEN,
      1,
      uniswapSwap.address
    ));

    await expect( await daiToken.balanceOf(uniswapSwap.address)).to.be.equal(swapDAI); 


    console.log("DAI after SWAP", await daiToken.balanceOf(uniswapSwap.address));



  });


  after(async () => {
    //stop impersonating accounts
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [seller],
    });
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [buyer],
    });

  })


});
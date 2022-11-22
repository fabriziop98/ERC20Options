import { ethers, network } from "hardhat";
import { Signer, Wallet, BigNumber } from "ethers";
import { expect } from "chai";
//import { SingleSwap } from "../typechain-types/contracts/UniSwapSwapV3.sol";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20";
import { SingleSwap } from "../typechain-types/contracts/UniswapSwapV3.sol";



describe("Swap WETH/DAI with Uniswap", () => {

  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; //Address DAI MAINNET
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";//Address WETH MAINNET
  const buyer = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Address with some DAI
  const seller = "0x242510fE96a4Fa2d4aC7dE68cD41944cd71d4099"; //Address with some WETH
  const ONE_TOKEN = ethers.utils.parseEther("1");
  const swapDAI = ethers.utils.parseEther("1215.935834500324316545");


  let uniswapSwap: SingleSwap;
  let sellerSigner: Signer;
  let buyerSigner: Signer;
  let owner: Signer;
  let wethToken: IERC20;
  let daiToken: IERC20;

  before(async () => { //Setup 

    [owner] = await ethers.getSigners();
    const uniSwapFactory = await ethers.getContractFactory("SingleSwap");
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
    //await daiToken.connect(buyerSigner).transfer(flashLoanv2.address, DAI_FEE); // 4 DAIS
    await wethToken.connect(sellerSigner).transfer(uniswapSwap.address, ONE_TOKEN);

    //address _tokenIN, address _tokenOut,uint256 _amountIn
    await (uniswapSwap.connect(sellerSigner).swapExactInputSingle(
      wethToken.address,
      daiToken.address,
      ONE_TOKEN,
      uniswapSwap.address
    ));

   // await expect( await daiToken.balanceOf(uniswapSwap.address)).to.be.equal(swapDAI); 

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
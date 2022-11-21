import { ethers, network } from "hardhat";
import { Signer, Wallet, BigNumber } from "ethers";
import { expect } from "chai";
import { ERC20Pool, OptionTrigger } from "../typechain-types";
import { IERC20 } from "../typechain-types/interfaces";

describe("Excercise option with FlashLoan", () => {

  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; //Address DAI MAINNET
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";//Address WETH MAINNET
  const buyer = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Address with some DAI
  const seller = "0x242510fE96a4Fa2d4aC7dE68cD41944cd71d4099"; //Address with some WETH
  const ONE_TOKEN = ethers.utils.parseEther("1");
  const PRIME = ethers.utils.parseEther("50");
  const DAI_STRIKE = ethers.utils.parseEther("1100");
  const DAI_FEE= ethers.utils.parseEther("4");

  let erc20Pool: ERC20Pool;
  let optionTrigger: OptionTrigger;
  let sellerSigner: Signer;
  let buyerSigner: Signer;
  let owner: Signer;
  let wethToken: IERC20;
  let daiToken: IERC20;

  before(async () => { //Setup 

    [owner] = await ethers.getSigners();
    const ERC20PoolFactory = await ethers.getContractFactory("ERC20Pool");
    erc20Pool = await ERC20PoolFactory.deploy();
    const OptionFactory = await ethers.getContractFactory("OptionTrigger");
    optionTrigger = await OptionFactory.deploy(erc20Pool.address);
    //Set optionTriggerContract
    erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
    //start impersonatings accounts
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
    expect(erc20Pool).to.not.empty;
    expect(optionTrigger).to.not.empty;
  });

  it("Should Sell option", async () => {
    await wethToken.connect(sellerSigner).approve(erc20Pool.address, ONE_TOKEN);


    await expect(await optionTrigger.connect(sellerSigner).sellOption(
      DAI_STRIKE, // Quantity of DAI that i have to pay to: 1100 DAI
      ONE_TOKEN, //OF WETH 
      PRIME,//50 DAI
      86400 * 7, //period (seconds) 86400 = 1 day
      daiToken.address, //payment token (to buy and excersice the option)
      wethToken.address, //option token
      0 // 0 -> Call, 1 -> Put
    )).to.emit(optionTrigger, "OptionCreated").withArgs(
      0, await sellerSigner.getAddress(), 0);




  });
  it("Should Buy Option", async () => {
    await daiToken.connect(buyerSigner).approve(erc20Pool.address, PRIME);

    await (optionTrigger.connect(buyerSigner).buyOption(
      0,
      daiToken.address,
      PRIME
    ));
    await expect((await optionTrigger.getOption(0)).buyer)
    .to.equal(await buyerSigner.getAddress());

  });
  it("Should Exercise Option", async () => {
     //Advance block timestamp
     await ethers.provider.send("evm_increaseTime", [86400*6]);
  
     const amount = await (await optionTrigger.getOption(0)).strike; 
    
      
      await optionTrigger.connect(buyerSigner).exerciseOptionFlashLoan(
         0,
         daiToken.address,
         amount
     );
     await expect((await optionTrigger.options(0)).state).to.equal(2); 

     console.log("How much i have in contract",await daiToken.connect(buyerSigner).balanceOf(optionTrigger.address));
     console.log("Profit Buyer",await daiToken.connect(buyerSigner).balanceOf(await buyerSigner.getAddress()));

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
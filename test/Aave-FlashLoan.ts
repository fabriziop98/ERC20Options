import { artifacts, ethers, network } from "hardhat";
import { Signer, Wallet, BigNumber } from "ethers";
import { expect } from "chai";
import { FlashLoanv2 } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20";


describe("Excercise option with FlashLoan", () => {

    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; //Address DAI MAINNET
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";//Address WETH MAINNET
    const buyer = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Address with some DAI
    const seller = "0x242510fE96a4Fa2d4aC7dE68cD41944cd71d4099"; //Address with some WETH
    const DAI_STRIKE = ethers.utils.parseEther("8404");
    const DAI_INITIAL= ethers.utils.parseEther("10");
    const DAI_FINAL= ethers.utils.parseEther("2.4364");    
    const ADDRESS_PROVIDER = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
    let flashLoanv2: FlashLoanv2;

    //let optionTrigger: OptionTrigger;
    let sellerSigner: Signer;
    let buyerSigner: Signer;
    let owner: Signer;
    let wethToken: IERC20;
    let daiToken: IERC20;

    before(async () => { //Setup 

        [owner] = await ethers.getSigners();
        const flashLoanv2Factory = await ethers.getContractFactory("FlashLoanv2");
        flashLoanv2 = await flashLoanv2Factory.deploy(ADDRESS_PROVIDER);

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
        expect(flashLoanv2).to.not.empty;
        //expect(optionTrigger).to.not.empty;
    });



    it("Should borrow 8404 DAI", async () => {
        
        await daiToken.connect(buyerSigner).transfer(flashLoanv2.address, DAI_INITIAL); 
        //console.log("DAI before FLASHLOAN", await daiToken.balanceOf(flashLoanv2.address)); //4 dais
        await (flashLoanv2.connect(buyerSigner).requestFlashLoan(
            daiToken.address,
            DAI_STRIKE, //8404

        ));

     
        expect(await daiToken.balanceOf(flashLoanv2.address)).to.be.equal(DAI_FINAL)

        //console.log("DAI after FLASHLOAN", await daiToken.balanceOf(flashLoanv2.address));//39343 dais

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
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20Pool", function() {
    
    const LOCKED_AMOUNT = 1000;

    async function deployERC20PoolFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, optionContract] = await ethers.getSigners();
    
        const ERC20Pool = await ethers.getContractFactory("ERC20Pool");
        const erc20Pool = await ERC20Pool.deploy();

        const LPToken = await ethers.getContractFactory("LpToken");
        const erc20 = await LPToken.deploy(LOCKED_AMOUNT,"LpToken","LP");

        return { erc20Pool, owner, otherAccount, erc20, optionContract };
    }

    describe("setOptionTrigger()", async function(){
        it("Should set the optionTrigger contract", async function (){
            const {erc20Pool, owner} = await loadFixture(deployERC20PoolFixture);
            await erc20Pool.connect(owner).setOptionTrigger(owner.address);
            await expect(await erc20Pool.getOptionTrigger()).to.equal(owner.address); 
        });

        describe("Modifiers", async function (){
            it("Should not set the optionTrigger contract: not owner", async function (){
                const {erc20Pool, otherAccount} = await loadFixture(deployERC20PoolFixture);
                await expect(erc20Pool.connect(otherAccount).setOptionTrigger(otherAccount.address))
                    .to.be.revertedWith(
                        "Ownable: caller is not the owner"
                    );
            });
    
            it("Should not set the optionTrigger contract: not valid address", async function (){
                const {erc20Pool, owner} = await loadFixture(deployERC20PoolFixture);
                await expect(erc20Pool.connect(owner).setOptionTrigger("0x0000000000000000000000000000000000000000"))
                    .to.be.revertedWith(
                        "Zero address"
                    );
            })
        })
    });

    describe("transferLockedErc20()", async function(){
        it("Should update lockedErc20Balance mapping", async function() {
            const {erc20Pool, owner, erc20, optionContract} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 100);
            await expect(await erc20Pool.lockedErc20Balance(erc20.address)).to.equal(100);
        });

        it("Should revert with not option contract", async function() {
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await expect(erc20Pool.connect(otherAccount).transferLockedErc20(owner.address, erc20.address, 100))
                .to.be.revertedWith("Caller is not valid");
        });

        it("Should revert with not valid amount", async function() {
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await expect(erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 0))
                .to.be.revertedWith("Amount not valid");
        });

        describe("Events", async function(){
            it("Should emit LockedAmount", async function() {
                const {erc20Pool, owner, erc20, optionContract} = await loadFixture(deployERC20PoolFixture);
                //First set the option trigger contract address
                await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
                //approve erc20pool from owner to trasnfer erc20 token
                await erc20.connect(owner).approve(erc20Pool.address, 10000);
                //Call as optionContract to transferLockedErc20
                await expect(erc20Pool.connect(optionContract)
                    .transferLockedErc20(owner.address, erc20.address, 100))
                        .to.emit(erc20Pool, "LockedAmount")
                        .withArgs(erc20.address, 100, 100);
            });
        })
    });
    
    describe("transferErc20()", async function() {

        it("Should transfer ERC20", async function (){
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await erc20Pool.connect(optionContract).transferErc20(owner.address, erc20.address, otherAccount.address, 100);
        });

        it("Should revert with not option contract", async function (){
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await expect(erc20Pool.connect(otherAccount).transferErc20(owner.address, erc20.address, otherAccount.address, 100))
                .to.be.revertedWith("Caller is not valid");
        });

        it("Should revert with not valid address", async function (){
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await expect(erc20Pool.connect(optionContract).transferErc20(owner.address, "0x0000000000000000000000000000000000000000", otherAccount.address, 100))
                .to.be.revertedWith("Zero address");
        });

        it("Should revert with not option contract", async function (){
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await expect(erc20Pool.connect(optionContract).transferErc20(owner.address, erc20.address, otherAccount.address, 0))
                .to.be.revertedWith("Amount not valid");
        });
    });

    describe("exerciseErc20()", async function() {
        
        it("should exercise an option", async function(){
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);

            //Lock funds in pool
            await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 100);
            //Call as optionContract to exerciseErc20
            await erc20Pool.connect(optionContract).exerciseErc20(
                owner.address, 
                otherAccount.address,
                erc20.address, 
                100,
                erc20.address,
                100);
            
            await expect(await erc20Pool.getUnLockedAmount(erc20.address)).to.equal(0);
            await expect(await erc20Pool.getLockedAmount(erc20.address)).to.equal(0);
        });

        it("should revert with not enough locked tokens", async function(){
            const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);

            //Lock funds in pool
            await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 90);
            //Call as optionContract to exerciseErc20
            await expect(erc20Pool.connect(optionContract).exerciseErc20(
                owner.address, 
                otherAccount.address,
                erc20.address, 
                100,
                erc20.address,
                100)).to.be.revertedWith("Not enough locked tokens");
        });

        describe("Events", async function (){

            it("Should emit UnlockedAmount(erc20.address, 100, 100)", async function () {
                const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
                //First set the option trigger contract address
                await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
                //approve erc20pool from owner to trasnfer erc20 token
                await erc20.connect(owner).approve(erc20Pool.address, 10000);
    
                //Lock funds in pool
                await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 100);
                //Call as optionContract to exerciseErc20
                await expect(erc20Pool.connect(optionContract).exerciseErc20(
                    owner.address, 
                    otherAccount.address,
                    erc20.address, 
                    100,
                    erc20.address,
                    100)
                ).to.emit(erc20Pool, "UnlockedAmount")
                        .withArgs(erc20.address, 100, 100);
            });

            it("Should emit TransferedAmount(erc20.address, 100)", async function () {
                const {erc20Pool, owner, erc20, optionContract, otherAccount} = await loadFixture(deployERC20PoolFixture);
                //First set the option trigger contract address
                await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
                //approve erc20pool from owner to trasnfer erc20 token
                await erc20.connect(owner).approve(erc20Pool.address, 10000);
    
                //Lock funds in pool
                await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 100);
                //Call as optionContract to exerciseErc20
                await expect(erc20Pool.connect(optionContract).exerciseErc20(
                    owner.address, 
                    otherAccount.address,
                    erc20.address, 
                    100,
                    erc20.address,
                    100)
                ).to.emit(erc20Pool, "TransferedAmount")
                        .withArgs(erc20.address, 100);
            });
        });
    });

    describe("getLockedAmount()", async function () {
        it("Should return 100", async function() {

            const {erc20Pool, owner, erc20, optionContract} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 100);
            await expect(await erc20Pool.getLockedAmount(erc20.address)).to.equal(100);
            
        });
    });

    describe("getLockedAmount()", async function () {
        it("Should return 100", async function() {

            const {erc20Pool, owner, erc20, optionContract} = await loadFixture(deployERC20PoolFixture);
            //First set the option trigger contract address
            await erc20Pool.connect(owner).setOptionTrigger(optionContract.address);
            //approve erc20pool from owner to trasnfer erc20 token
            await erc20.connect(owner).approve(erc20Pool.address, 10000);
            //Call as optionContract to transferLockedErc20
            await erc20Pool.connect(optionContract).transferLockedErc20(owner.address, erc20.address, 100);
            await expect(await erc20Pool.getLockedAmount(erc20.address)).to.equal(100);
            
        });
    });

});
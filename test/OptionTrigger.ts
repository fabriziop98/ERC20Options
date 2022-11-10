import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OptionTrigger", function() {

    const LOCKED_AMOUNT = 1000;

    async function deployOptionTriggerFixture() {
    
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const ERC20Pool = await ethers.getContractFactory("ERC20Pool");
        const erc20Pool = await ERC20Pool.deploy();

        const LPToken = await ethers.getContractFactory("LpToken");
        const erc20 = await LPToken.deploy(LOCKED_AMOUNT,"LpToken","LP");

        const LPToken2 = await ethers.getContractFactory("LpToken");
        const otherErc20 = await LPToken2.deploy(LOCKED_AMOUNT,"LpToken","LP");
    
        const OptionTrigger = await ethers.getContractFactory("OptionTrigger");
        const optionTrigger = await OptionTrigger.deploy(erc20Pool.address);
    
        //Set optionTriggerContract
        erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);

        return { erc20Pool, optionTrigger, owner, otherAccount, erc20, otherErc20 };
    }

    describe("sellOption()", async function() {
        it("Should not revert and emit OptionCreated(0, owner.address, 1)", async function(){
            const {optionTrigger, owner, erc20, otherErc20, erc20Pool} = await loadFixture(deployOptionTriggerFixture);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await expect(optionTrigger.connect(owner).sellOption(
                200, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            )).to.emit(optionTrigger, "OptionCreated").withArgs(
                0,owner.address,1
            );
            
            //Options length should be 1
            await expect((await optionTrigger.getAllOptions()).length).to.equal(1);
            //Option 0 seller should be owner
            await expect((await optionTrigger.getOption(0)).seller).to.equal(owner.address);
            //seller option id should be 0
            await expect(Number(await optionTrigger.getSellerOptions(owner.address))).to.equal(Number("0"));

        });

        it("Should revert with 'Strike is too small'", async function(){
            const {optionTrigger, owner, erc20, otherErc20} = await loadFixture(deployOptionTriggerFixture);
            
            await expect(optionTrigger.connect(owner).sellOption(
                0, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            )).to.be.revertedWith("Strike is too small");
            
        });

        it("Should revert with 'Amount is too small'", async function(){
            const {optionTrigger, owner, erc20, otherErc20} = await loadFixture(deployOptionTriggerFixture);
            
            await expect(optionTrigger.connect(owner).sellOption(
                200, //strike price
                0, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            )).to.be.revertedWith("Amount is too small");
            
        });

        it("Should revert with 'Period is too short'", async function(){
            const {optionTrigger, owner, erc20, otherErc20} = await loadFixture(deployOptionTriggerFixture);
            
            await expect(optionTrigger.connect(owner).sellOption(
                200, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                200,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            )).to.be.revertedWith("Period is too short");
            
        });

        it("Should revert with 'Period is too long'", async function(){
            const {optionTrigger, owner, erc20, otherErc20} = await loadFixture(deployOptionTriggerFixture);
            
            await expect(optionTrigger.connect(owner).sellOption(
                200, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 29,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            )).to.be.revertedWith("Period is too long");
            
        });
        
    });

    describe("buyOption()", async function() {
        
        it("Should not revert", async function() {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            );

            //Transfer funds to other account
            await erc20.connect(owner).transfer(otherAccount.address, 1000);
            //Other accounts approves erc20pool to transfer erc20 to option owner
            await erc20.connect(otherAccount).approve(erc20Pool.address, 1000);

            await (optionTrigger.connect(otherAccount).buyOption(
                0,
                erc20.address,
                5
            ));

            await expect((await optionTrigger.getOption(0)).buyer)
                .to.equal(otherAccount.address);
            await expect((await optionTrigger.getOption(0)).state)
                .to.equal(1);
            await expect(Number(await optionTrigger.getBuyerOptions(otherAccount.address)))
                .to.equal(Number("0"));
        });

        it("Should revert with 'Payment token not valid'", async function() {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            );

            //Transfer funds to other account
            await erc20.connect(owner).transfer(otherAccount.address, 1000);
            //Other accounts approves erc20pool to transfer erc20 to option owner
            await erc20.connect(otherAccount).approve(erc20Pool.address, 1000);

            await expect((optionTrigger.connect(otherAccount).buyOption(
                0,
                otherErc20.address, //not valid payment token
                5
            ))).to.be.revertedWith("Payment token not valid");

        });

        it("Should revert with 'Premium amount not valid'", async function() {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            );

            //Transfer funds to other account
            await erc20.connect(owner).transfer(otherAccount.address, 1000);
            //Other accounts approves erc20pool to transfer erc20 to option owner
            await erc20.connect(otherAccount).approve(erc20Pool.address, 1000);

            await expect((optionTrigger.connect(otherAccount).buyOption(
                0,
                erc20.address, //not valid payment token
                4
            ))).to.be.revertedWith("Premium amount not valid");

        });

        describe("Events", async function() {
            it("Should emit OptionLocked(0, otherAccount.address)", async function() {
                const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);
        
                await optionTrigger.connect(owner).sellOption(
                    200, //strike price
                    100, //amount of tokens msg.sender offers
                    5,   //premium amount
                    86400 * 7,    //period (seconds) 86400 = 1 day
                    erc20.address, //payment token
                    otherErc20.address, //option token
                    1 // 0 -> Call, 1 -> Put
                );
        
                //Transfer funds to other account
                await erc20.connect(owner).transfer(otherAccount.address, 1000);
                //Other accounts approves erc20pool to transfer erc20 to option owner
                await erc20.connect(otherAccount).approve(erc20Pool.address, 1000);
        
                await expect((optionTrigger.connect(otherAccount).buyOption(
                    0,
                    erc20.address,
                    5
                ))).to.emit(optionTrigger, "OptionLocked").withArgs(
                    0, otherAccount.address
                );
            });
        });

        describe("exerciseOption()", async function(){
            
            async function createAndBuyOption(optionTrigger: any, owner: any, erc20: any, otherErc20: any, erc20Pool: any, otherAccount: any){
            
                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);
    
                await optionTrigger.connect(owner).sellOption(
                    200, //strike price
                    100, //amount of tokens msg.sender offers
                    5,   //premium amount
                    86400 * 7,    //period (seconds) 86400 = 1 day
                    erc20.address, //payment token
                    otherErc20.address, //option token
                    1 // 0 -> Call, 1 -> Put
                );
    
                //Transfer funds to other account
                await erc20.connect(owner).transfer(otherAccount.address, 1000);
                //Other accounts approves erc20pool to transfer erc20 to option owner
                await erc20.connect(otherAccount).approve(erc20Pool.address, 1000);
    
                await (optionTrigger.connect(otherAccount).buyOption(
                    0,
                    erc20.address, //not valid payment token
                    5
                ));
            }

            it("Should not revert", async function(){

                const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
                
                // createAndBuyOption(optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount);

                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);
    
                await optionTrigger.connect(owner).sellOption(
                    200, //strike price
                    100, //amount of tokens msg.sender offers
                    5,   //premium amount
                    86400 * 7,    //period (seconds) 86400 = 1 day
                    erc20.address, //payment token
                    otherErc20.address, //option token
                    1 // 0 -> Call, 1 -> Put
                );
    
                //Transfer funds to other account
                await erc20.connect(owner).transfer(otherAccount.address, 1000);
                //Other accounts approves erc20pool to transfer erc20 to option owner
                await erc20.connect(otherAccount).approve(erc20Pool.address, 1000);
                await (optionTrigger.connect(otherAccount).buyOption(
                    0,
                    erc20.address, //not valid payment token
                    5
                ));

                // FINISHED CREATING AND BUYING OPTION

                await optionTrigger.connect(otherAccount).excerciseOption(
                    0,
                    erc20.address,
                    100
                );
                await expect((await optionTrigger.options(0)).state).to.equal(2);


                
            });
        });
    });

});
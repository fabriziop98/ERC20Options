import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
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

            expect(optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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
            expect((await optionTrigger.getAllOptions()).length).to.equal(1);
            //Option 0 seller should be owner
            expect((await optionTrigger.getOption(0)).seller).to.equal(owner.address);
            //seller option id should be 0
            // When running test in localhost , this ID can be = 1
            expect(Number(await optionTrigger.getSellerOptions(owner.address))).to.equal(Number("0"));
            expect(await otherErc20.balanceOf(owner.address)).to.equal(1000000000000000000000n - 100n);

        });

        it("Should not revert and check fee = 1", async function(){
            const {optionTrigger, owner, erc20, otherErc20, erc20Pool} = await loadFixture(deployOptionTriggerFixture);

            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);

            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
                100, //amount of tokens msg.sender offers
                5,   //premium amount
                86400 * 7,    //period (seconds) 86400 = 1 day
                erc20.address, //payment token
                otherErc20.address, //option token
                1 // 0 -> Call, 1 -> Put
            );
            
            //Amount of otherErc20 should be 1
            expect(await erc20Pool.getFees(otherErc20.address)).to.equal(1);
        });

        it("Should revert with 'Strike is too small'", async function(){
            const {optionTrigger, owner, erc20, otherErc20} = await loadFixture(deployOptionTriggerFixture);
            
            expect(optionTrigger.connect(owner).sellOption(
                0, //strike price: erc20 amount
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
            
            expect(optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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
            
            expect(optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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
            
            expect(optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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
                200, //strike price: erc20 amount
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

            expect((await optionTrigger.getOption(0)).buyer)
                .to.equal(otherAccount.address);
            expect((await optionTrigger.getOption(0)).state)
                .to.equal(1);
            expect(Number(await optionTrigger.getBuyerOptions(otherAccount.address)))
                .to.equal(Number("0"));
            expect(await erc20.balanceOf(owner.address)).to.equal(999999999999999999000n + 5n);
            expect(await erc20.balanceOf(otherAccount.address)).to.equal(1000 - 5);
        });

        it("Should revert with 'Payment token not valid'", async function() {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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

            expect((optionTrigger.connect(otherAccount).buyOption(
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
                200, //strike price: erc20 amount
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

            expect((optionTrigger.connect(otherAccount).buyOption(
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
                    200, //strike price: erc20 amount
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
        
                expect((optionTrigger.connect(otherAccount).buyOption(
                    0,
                    erc20.address,
                    5
                ))).to.emit(optionTrigger, "OptionLocked").withArgs(
                    0, otherAccount.address
                );
            });
        });

    });

    describe("exerciseOption()", async function(){
            
        it("Should not revert, buyer exercises option on the 6th day", async function(){

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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

            // FINISHED CREATING AND BUYING OPTION

            //Advance block timestamp
            await ethers.provider.send("evm_increaseTime", [86400*6]);

            const effectiveAmount = 200;
            await optionTrigger.connect(otherAccount).exerciseOption(
                0,
                erc20.address,
                effectiveAmount
            );

            expect((await optionTrigger.options(0)).state).to.equal(2);
            expect(await erc20.balanceOf(owner.address)).to.equal(999999999999999999005n + 200n);
            expect(await erc20.balanceOf(otherAccount.address)).to.equal(995 - 200);
            expect(await otherErc20.balanceOf(otherAccount.address)).to.equal(99);
        });

        it("Should revert with 'You are not the buyer'", async function(){

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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

            expect(optionTrigger.connect(owner).exerciseOption(
                0,
                erc20.address,
                100
            )).to.be.revertedWith("You are not the buyer");
        });

        it("Should revert with 'The option expired'", async function(){

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
            
            //Set optionTriggerContract
            erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
            
            await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

            await optionTrigger.connect(owner).sellOption(
                200, //strike price: erc20 amount
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

            //Advance block timestamp
            await ethers.provider.send("evm_increaseTime", [86400*7]);

            expect(optionTrigger.connect(otherAccount).exerciseOption(
                0,
                erc20.address,
                100
            )).to.be.revertedWith("The option expired");
        });

        describe("Events", async function(){
            it("Should emit OptionExecuted(0)", async function(){

                const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
                
                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);
    
                await optionTrigger.connect(owner).sellOption(
                    200, //strike price: erc20 amount
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

                const effectiveAmount = 200;
                expect(optionTrigger.connect(otherAccount).exerciseOption(
                    0,
                    erc20.address,
                    effectiveAmount
                )).to.emit(optionTrigger, "OptionExecuted").withArgs(0);
            });
        });
    });

    describe("cancelOption()", async function() {
        
        it("Should not revert", async function () {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
                
                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);

                await optionTrigger.connect(owner).sellOption(
                    200, //strike price: erc20 amount
                    100, //amount of tokens msg.sender offers
                    5,   //premium amount
                    86400 * 7,    //period (seconds) 86400 = 1 day
                    erc20.address, //payment token
                    otherErc20.address, //option token
                    0 // 0 -> Call, 1 -> Put
                );

                // FINISHED CREATING OPTION
                await optionTrigger.connect(owner).cancelOption(0);


                // State 4 -> Canceled
                expect((await optionTrigger.getOption(0)).state).to.equal(3);
                expect(await otherErc20.balanceOf(owner.address)).to.equal(999999999999999999999n); 
        });

        it("Should revert with 'You are not the owner of the option'", async function () {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
                
                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);
    
                await optionTrigger.connect(owner).sellOption(
                    200, //strike price: erc20 amount
                    100, //amount of tokens msg.sender offers
                    5,   //premium amount
                    86400 * 7,    //period (seconds) 86400 = 1 day
                    erc20.address, //payment token
                    otherErc20.address, //option token
                    0 // 0 -> Call, 1 -> Put
                );
    
                // FINISHED CREATING OPTION
                expect(optionTrigger.connect(otherAccount).cancelOption(0)).to.be.revertedWith(
                    "You are not the owner of the option"
                );

                // State 0 -> New
                expect((await optionTrigger.getOption(0)).state).to.equal(0); 
        });

        it("Should revert with 'Cannot cancel the option'", async function () {

            const {optionTrigger, owner, erc20, otherErc20, erc20Pool, otherAccount} = await loadFixture(deployOptionTriggerFixture);
                
                //Set optionTriggerContract
                erc20Pool.connect(owner).setOptionTrigger(optionTrigger.address);
                
                await otherErc20.connect(owner).approve(erc20Pool.address, 1000);
    
                await optionTrigger.connect(owner).sellOption(
                    200, //strike price: erc20 amount
                    100, //amount of tokens msg.sender offers
                    5,   //premium amount
                    86400 * 7,    //period (seconds) 86400 = 1 day
                    erc20.address, //payment token
                    otherErc20.address, //option token
                    0 // 0 -> Call, 1 -> Put
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
                expect(optionTrigger.connect(owner).cancelOption(0)).to.be.revertedWith(
                    "Cannot cancel the option"
                );

                // State 1 -> New
                expect((await optionTrigger.getOption(0)).state).to.equal(1); 
        });
    });

});
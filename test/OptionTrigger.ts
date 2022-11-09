import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OptionTrigger", function() {

    async function deployOptionTriggerFixture() {
        const ONE_GWEI = 1_000_000_000;
    
        const lockedAmount = ONE_GWEI;
    
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();
    
        const SimpleBankMapping = await ethers.getContractFactory("OptionTrigger");
        const simpleBankMapping = await SimpleBankMapping.deploy({ value: lockedAmount });

        return { simpleBankMapping, lockedAmount, owner, otherAccount };
    }

});
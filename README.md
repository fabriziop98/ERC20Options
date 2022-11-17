# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
``` ps aux | grep hardhat kill -9 pid ```

#Up the node of the fork mainnet 
npx hardhat node 
#Test with the fork mainet
npx hardhat test --network localhost test/test-fork-mainnet.ts 
#Connect to the console HardHat
npx hardhat console --network localhost

#Deploy and transfer usdc 
npx hardhat run --network localhost scripts/getDai.ts 

#PoolAddressesProvider-Aave Goerli 
0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D

#USDC contract
0x9FD21bE27A2B059a288229361E2fA632D8D2d074

#Youtube
https://www.youtube.com/watch?v=MxTgk-kvtRM
#Github
https://github.com/stakewithus/defi-by-example